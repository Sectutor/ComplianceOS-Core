import React from "react";
import { Button } from "@complianceos/ui/ui/button";
import { Wand2 } from "lucide-react";
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

export default function PolicyRewriteButton({
  content,
  name,
  clientId,
  policyId,
  mode,
  onRewrite,
}: {
  content: string;
  name?: string;
  clientId?: number;
  policyId?: number;
  mode?: 'rewrite' | 'improve_placeholders';
  onRewrite: (html: string) => void;
}) {
  const refine = trpc.clientPolicies.refine.useMutation();

  const handleRewrite = async () => {

    if (!clientId || isNaN(Number(clientId))) {
      toast.error("Client context is missing. Please refresh the page.");
      return;
    }

    try {
      toast.info(mode === 'improve_placeholders' ? "Fixing placeholders..." : "Rewriting policy...");

      let instruction = "Improve clarity, tone, and formatting.";
      if (mode === 'improve_placeholders') {
        instruction = "Identify any placeholders (like [Company Name], TBD, etc.) and replace them with generic but plausible placeholder text or instructions. Keep the rest of the content exactly the same.";
      }

      const res = await refine.mutateAsync({
        clientId: Number(clientId),
        content,
        instruction,
        mode: mode === 'improve_placeholders' ? 'fix_placeholders' : 'refine',
        context: {
          clientName: name || "the Organization", // Backend will fetch real name if available
        }
      });

      const text = res.content || "";
      const cleaned = cleanGeneratedHtml(text);
      // Ensure we have valid HTML, otherwise parse markdown
      const html = /<[a-z][\s\S]*>/i.test(cleaned) ? cleaned : (marked.parse(cleaned, { async: false }) as string);

      onRewrite(html);
      toast.success("Policy improved");
    } catch (err: any) {
      console.error("[PolicyRewriteButton] failed:", err);
      toast.error(err.message || "Failed to rewrite policy");
    }
  };

  return (
    <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleRewrite} disabled={refine.isPending}>
      <Wand2 className="mr-2 h-4 w-4" />
      {refine.isPending ? "Processing..." : (mode === 'improve_placeholders' ? "Fix Placeholders" : "Rewrite with AI")}
    </Button>
  );
}
