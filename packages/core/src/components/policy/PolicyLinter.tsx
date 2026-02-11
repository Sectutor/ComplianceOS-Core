import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { AlertTriangle, CheckCircle2, Plus, Wand2, Loader2, Sparkles } from "lucide-react";
import { marked } from "marked";
import { cn } from "@/lib/utils";
// Removed premium slot actions for placeholders to avoid duplicate/faulty buttons
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type LinterIssue = {
  id: string;
  type: "missing" | "warning" | "ok";
  title: string;
  description?: string;
  fixable?: boolean;
};

type SectionTemplate = {
  id: string;
  title: string;
  markdown: string;
  keywords: string[];
};

const DEFAULT_SECTIONS: SectionTemplate[] = [
  {
    id: "purpose",
    title: "Purpose",
    markdown:
      "## Purpose\n\nThis policy establishes the objectives and intent of the organization regarding the subject matter, ensuring consistent and compliant operations.",
    keywords: ["purpose", "objective", "intent"],
  },
  {
    id: "scope",
    title: "Scope",
    markdown:
      "## Scope\n\nThis policy applies to all relevant employees, contractors, systems, and processes within the organization as defined herein.",
    keywords: ["scope", "applies", "applicability"],
  },
  {
    id: "roles",
    title: "Roles and Responsibilities",
    markdown:
      "## Roles and Responsibilities\n\n- Executive Sponsor: Provides oversight and approves changes\n- Policy Owner: Maintains and reviews the policy\n- Employees: Comply with policy requirements",
    keywords: ["roles", "responsibilities", "owner", "sponsor"],
  },
  {
    id: "policy",
    title: "Policy Statements",
    markdown:
      "## Policy Statements\n\nThe organization mandates the following requirements:\n\n1. \n2. \n3. ",
    keywords: ["policy", "requirements", "mandate"],
  },
  {
    id: "procedures",
    title: "Procedures",
    markdown:
      "## Procedures\n\nDescribe the procedures and steps required to implement this policy, including who performs them and when.",
    keywords: ["procedures", "process", "steps"],
  },
  {
    id: "exceptions",
    title: "Exceptions",
    markdown:
      "## Exceptions\n\nExceptions to this policy must be documented, risk-assessed, and approved by the Policy Owner and Executive Sponsor.",
    keywords: ["exceptions", "deviation", "waiver"],
  },
  {
    id: "enforcement",
    title: "Enforcement",
    markdown:
      "## Enforcement\n\nNon-compliance with this policy may result in disciplinary action and corrective measures in accordance with HR policies and applicable laws.",
    keywords: ["enforcement", "discipline", "non-compliance"],
  },
  {
    id: "definitions",
    title: "Definitions",
    markdown:
      "## Definitions\n\nProvide definitions for key terms used in this policy to ensure clarity and consistency.",
    keywords: ["definitions", "glossary", "terms"],
  },
  {
    id: "references",
    title: "References",
    markdown:
      "## References\n\nList related policies, standards, procedures, and external regulations that inform this policy.",
    keywords: ["references", "related policies", "standards", "regulations"],
  },
  {
    id: "revision",
    title: "Revision History",
    markdown:
      "## Revision History\n\n| Version | Date | Author | Changes |\n|--------|------|--------|---------|\n| 1.0    |      |        | Initial publication |\n",
    keywords: ["revision", "history", "version", "changes"],
  },
];

function normalizeText(htmlOrMarkdown: string) {
  const text = htmlOrMarkdown
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
  return text;
}

function hasSection(contentText: string, section: SectionTemplate) {
  const titleMatch = contentText.includes(section.title.toLowerCase());
  const keywordMatch = section.keywords.some((k) => contentText.includes(k.toLowerCase()));
  return titleMatch || keywordMatch;
}

function getPlaceholderMatches(contentText: string) {
  const patterns = [
    { regex: /\bTBD\b/i, label: 'TBD' },
    { regex: /\[?Company Name\]?/i, label: 'Company Name' },
    { regex: /\{\{company(_name)?\}\}/i, label: 'Template Variable' },
    { regex: /\bLOREM IPSUM\b/i, label: 'Lorem Ipsum' },
    { regex: /\[insert.*?\]/i, label: 'Insert Instruction' },
  ];
  const found = patterns.filter(p => p.regex.test(contentText)).map(p => p.label);
  // Remove duplicates
  return Array.from(new Set(found));
}

export function PolicyLinter({
  content,
  onInsertSection,
  onReplaceContent,
  clientId,
  policyId,
  orgName,
}: {
  content: string;
  onInsertSection: (htmlToAppend: string) => void;
  onReplaceContent?: (newHtml: string) => void;
  clientId?: number;
  policyId?: number;
  orgName?: string;
}) {
  const contentText = useMemo(() => normalizeText(content || ""), [content]);

  const sectionResults = useMemo<LinterIssue[]>(() => {
    return DEFAULT_SECTIONS.map((s) => {
      const present = hasSection(contentText, s);
      return {
        id: s.id,
        type: present ? "ok" : "missing",
        title: s.title,
        description: present ? undefined : "Section is recommended.",
        fixable: !present,
      };
    });
  }, [contentText]);

  const placeholderWarnings = useMemo<LinterIssue[]>(() => {
    const matches = getPlaceholderMatches(contentText);
    if (matches.length > 0) {
      return [
        {
          id: "placeholders",
          type: "warning",
          title: "Unresolved placeholders",
          description: `Found: ${matches.join(", ")}`,
          fixable: false,
        },
      ];
    }
    return [];
  }, [contentText]);

  const issues = [...sectionResults.filter((i) => i.type !== "ok"), ...placeholderWarnings];
  const missingSections = sectionResults.filter(i => i.type === "missing").map(i => ({ id: i.id, title: i.title }));

  const fixAllMutation = trpc.clientPolicies.incorporateLinterSections.useMutation({
    onSuccess: (data: any) => {
      if (onReplaceContent) {
        let cleanContent = data.content.trim();
        if (cleanContent.startsWith("```")) {
          cleanContent = cleanContent.replace(/^```(?:markdown)?\s*/, '').replace(/\s*```$/, '');
        }
        const html = marked.parse(cleanContent, { async: false }) as string;
        onReplaceContent(html);
        toast.success("AI has fixed issues and improved the policy!");
      }
    },
    onError: (error) => {
      toast.error(`AI fix failed: ${error.message}`);
    }
  });

  const handleFixAll = () => {
    if (!clientId || !policyId) {
      toast.error("Client or Policy context missing");
      return;
    }
    fixAllMutation.mutate({
      clientId,
      policyId,
      content,
      missingSections
    });
  };

  const appendSection = (sectionId: string) => {
    const section = DEFAULT_SECTIONS.find((s) => s.id === sectionId);
    if (!section) return;
    const html = marked.parse(section.markdown, { async: false }) as string;
    onInsertSection(`<div>${html}</div>`);
  };

  const fixPlaceholders = () => {
    if (!onReplaceContent) return;
    const name = (orgName || "").trim();
    let updated = content || "";
    if (name) {
      updated = updated
        .replace(/\[\s*Company\s+Name\s*\]/gi, name)
        .replace(/\bCompany\s+Name\b/gi, name)
        .replace(/\{\{\s*company(_name)?\s*\}\}/gi, name);
    }
    updated = updated
      .replace(/\bTBD\b/g, "")
      .replace(/\bLOREM IPSUM\b/gi, "")
      .replace(/\[insert.*?\]/gi, "");
    onReplaceContent(updated);
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Policy Linter</CardTitle>
            <CardDescription>Checks for required sections and common issues</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {missingSections.length > 0 && (
              <Button
                size="sm"
                variant="default"
                onClick={handleFixAll}
                disabled={fixAllMutation.isPending}
              >
                {fixAllMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                Fix All with AI
              </Button>
            )}
            <Badge variant="outline" className={cn(issues.length === 0 ? "text-green-700 border-green-200 bg-green-50" : "text-amber-700 border-amber-200 bg-amber-50")}>
              {issues.length === 0 ? "No issues" : `${issues.length} issue(s)`}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm">All required sections detected.</span>
          </div>
        ) : (
          <div className="space-y-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectionResults
                  .filter((i) => i.type === "missing")
                  .map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">
                        <div>{i.title}</div>
                        {i.description && <div className="text-xs text-muted-foreground">{i.description}</div>}
                      </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs">Missing</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">No action</span>
                    </TableCell>
                  </TableRow>
                ))}
                {placeholderWarnings.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">
                      <div>{i.title}</div>
                      {i.description && <div className="text-xs text-muted-foreground">{i.description}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs">Warning</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={fixPlaceholders}>
                        <Wand2 className="h-3 w-3 mr-1" />
                        Fix Placeholders
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-xs text-muted-foreground">
              Templates are generic and should be tailored to your organization.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PolicyLinter;
