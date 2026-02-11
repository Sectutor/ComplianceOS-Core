import React from "react";
import { Button } from "@complianceos/ui/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { marked } from "marked";
import { trpc } from "@/lib/trpc";

function decodeEntities(str: string) {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

function cleanGeneratedHtml(input: string) {
  let s = input || "";
  s = s.replace(/```html([\s\S]*?)```/gi, "$1").replace(/```([\s\S]*?)```/gi, "$1");
  s = s.replace(/<pre[\s\S]*?>[\s\S]*?<code[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/gi, "$1");
  if (s.includes("&lt;") || s.includes("&gt;")) s = decodeEntities(s);
  const bodyMatch = s.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) s = bodyMatch[1];
  s = s.replace(/<\/?(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  s = s.replace(/<section([^>]*)>/gi, "<div$1>").replace(/<\/section>/gi, "</div>");
  return s.trim();
}

export default function PolicySectionDraftButton({
  sectionId,
  sectionTitle,
  currentContent,
  onDraft,
  clientId,
  policyId,
}: {
  sectionId: string;
  sectionTitle: string;
  currentContent: string;
  onDraft: (html: string) => void;
  clientId?: number;
  policyId?: number;
}) {
  const draft = trpc.advisor.askQuestion.useMutation();

  const handleDraft = async () => {
    try {
      toast.info(`Drafting ${sectionTitle} with AI...`);
      const question = `Draft the "${sectionTitle}" section for this policy. Return concise, audit-ready content in HTML. No placeholders.`;
      const res = await draft.mutateAsync({
        clientId: Number(clientId),
        question,
        context: {
          type: "policy",
          id: String(policyId ?? sectionId),
          data: {
            title: sectionTitle,
            content: currentContent,
            mode: "draft_section",
          },
        },
      });
      const text = (res as any)?.answer || (res as any)?.text || "";
      const cleaned = cleanGeneratedHtml(text);
      const html = /<[a-z][\s\S]*>/i.test(cleaned) ? cleaned : (marked.parse(cleaned, { async: false }) as string);
      onDraft(`<div data-section="${sectionId}">${html}</div>`);
      toast.success("Section drafted");
    } catch (err: any) {
      console.error("[PolicySectionDraftButton] failed:", err);
      toast.error(err.message || "Failed to draft section");
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handleDraft} disabled={draft.isPending}>
      <Sparkles className="h-3 w-3 mr-1" />
      {draft.isPending ? "Drafting..." : "Draft with AI"}
    </Button>
  );
}
