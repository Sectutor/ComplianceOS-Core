import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@complianceos/ui/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@complianceos/ui/ui/tooltip';

export default function RichTextEditor({
  value,
  onChange,
  className,
  minHeight = "500px",
  onAiRewrite,
  onAiFix
}: {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  minHeight?: string;
  onAiRewrite?: () => void;
  onAiFix?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isUpdatingRef = useRef(false);

  // Helper to detect plain text and convert to HTML
  const processContent = (content: string) => {
    if (!content) return '';
    // If it doesn't look like HTML (no tags) but has newlines, convert to HTML
    if (!/<[a-z][\s\S]*>/i.test(content) && content.includes('\n')) {
      return content.split('\n').map(line => `<p>${line}</p>`).join('');
    }
    return content;
  };

  const stripPlaceholderWrap = (html: string) => {
    return (html || '').replace(/<span class="placeholder-token">([\s\S]*?)<\/span>/gi, '$1');
  };

  const highlightPlaceholders = (html: string) => {
    let s = stripPlaceholderWrap(html || '');
    const patterns: RegExp[] = [
      /\[\s*Company\s+Name\s*\]/gi,
      /\bCompany\s+Name\b/gi,
      /\{\{\s*company(?:_name)?\s*\}\}/gi,
      /\bTBD\b/g,
      /\bLOREM IPSUM\b/gi,
      /\[insert.*?\]/gi,
    ];
    patterns.forEach((re) => {
      s = s.replace(re, (m) => `<span class="placeholder-token">${m}</span>`);
    });
    return s;
  };
  // Ensure enumerated clauses like "5.1 Title:" start new paragraphs when multiple appear in one <p>
  const ensureEnumerationParagraphs = (html: string) => {
    try {
      const container = document.createElement('div');
      container.innerHTML = html || '';
      const ps = Array.from(container.querySelectorAll('p'));
      ps.forEach(p => {
        const inner = p.innerHTML;
        const enumerationCount = (inner.match(/\d+\.\d+\s/g) || []).length;
        if (enumerationCount < 2) return;
        let parts = inner.split(/(?<=:)\s+(?=\d+\.\d+\s)/g);
        if (parts.length <= 1) {
          parts = inner.split(/(?=\d+\.\d+\s)/g);
        }
        if (parts.length > 1) {
          const wrapper = document.createElement('div');
          parts.forEach(part => {
            const pe = document.createElement('p');
            pe.innerHTML = part.trim();
            wrapper.appendChild(pe);
          });
          p.replaceWith(...Array.from(wrapper.childNodes));
        }
      });
      return container.innerHTML;
    } catch {
      return html;
    }
  };
  // Set css var
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--min-height', minHeight);
    }
  }, [minHeight]);

  useEffect(() => {
    if (quillRef.current || !containerRef.current) return;

    // Add custom icons for undo/redo
    const icons = Quill.import('ui/icons') as Record<string, any>;
    icons['undo'] = `<svg viewbox="0 0 18 18"><polygon class="ql-fill ql-stroke" points="6 10 4 12 2 10 6 10"></polygon><path class="ql-stroke" d="M8.09,13.91A4.6,4.6,0,0,0,9,14,5,5,0,1,0,4,9"></path></svg>`;
    icons['redo'] = `<svg viewbox="0 0 18 18"><polygon class="ql-fill ql-stroke" points="12 10 14 12 16 10 12 10"></polygon><path class="ql-stroke" d="M9.91,13.91A4.6,4.6,0,0,1,9,14a5,5,0,1,1,5-5"></path></svg>`;

    const quill = new Quill(containerRef.current, {
      theme: 'snow',
      placeholder: 'Start writing your policy...',
      modules: {
        history: {
          delay: 2000,
          maxStack: 500,
          userOnly: true
        },
        toolbar: {
          container: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'font': [] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            ['clean'],
            ['undo', 'redo']
          ],
          handlers: {
            'undo': function (this: any) {
              this.quill.history.undo();
            },
            'redo': function (this: any) {
              this.quill.history.redo();
            }
          }
        }
      }
    });


    quill.on('text-change', (delta, oldDelta, source) => {
      if (source === 'user') {
        isUpdatingRef.current = true;
        const rawHtml = quill.root.innerHTML;
        const cleanHtml = stripPlaceholderWrap(rawHtml);
        onChange(cleanHtml);
        const sel = quill.getSelection();
        const highlighted = highlightPlaceholders(cleanHtml);
        quill.clipboard.dangerouslyPasteHTML(highlighted);
        if (sel) quill.setSelection(sel.index, sel.length || 0);
        isUpdatingRef.current = false;
      }
    });

    quillRef.current = quill;

    // Initial value
    if (value) {
      const initial = ensureEnumerationParagraphs(highlightPlaceholders(processContent(value)));
      quill.clipboard.dangerouslyPasteHTML(initial);
    }
  }, []); // Mount once

  // Sync external value changes
  useEffect(() => {
    if (quillRef.current && value !== undefined && !isUpdatingRef.current) {
      const currentContent = quillRef.current.root.innerHTML;
      const processedValue = ensureEnumerationParagraphs(highlightPlaceholders(processContent(value)));
      if (currentContent !== processedValue && currentContent !== value) {
        quillRef.current.clipboard.dangerouslyPasteHTML(processedValue);
      }
    }
  }, [value]);

  return (
    <div className={`rich-text-editor-wrapper bg-slate-50 p-4 rounded-lg border border-slate-200 ${className}`}>
      {(onAiRewrite || onAiFix) && (
        <div className="flex items-center justify-end gap-2 mb-2 p-2 bg-white rounded border border-slate-200 shadow-sm">
          {onAiRewrite && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onAiRewrite} className="text-purple-600 border-purple-200 hover:bg-purple-50">
                  <Wand2 className="mr-2 h-4 w-4" />
                  Rewrite with AI
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rephrase and improve clarity while maintaining meaning</p>
              </TooltipContent>
            </Tooltip>
          )}
          {onAiFix && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onAiFix} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Fix with AI
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Fix missing sections and resolve placeholders</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!quillRef.current) return;
                  const raw = quillRef.current.root.innerHTML;
                  const formatted = ensureEnumerationParagraphs(raw);
                  quillRef.current.clipboard.dangerouslyPasteHTML(formatted);
                }}
              >
                Format paragraphs
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Start each numbered clause as a new paragraph</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      <style>{`
        .rich-text-editor-wrapper .ql-toolbar {
            border: 1px solid #e2e8f0;
            border-bottom: none;
            border-top-left-radius: 0.5rem;
            border-top-right-radius: 0.5rem;
            background: #ffffff;
            padding: 8px;
        }
        .rich-text-editor-wrapper .ql-container {
            border: 1px solid #e2e8f0;
            border-bottom-left-radius: 0.5rem;
            border-bottom-right-radius: 0.5rem;
            background: #ffffff;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            font-size: 0.95rem;
            min-height: var(--min-height, 500px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .rich-text-editor-wrapper .ql-editor {
            padding: 2rem 3rem; /* Document-like padding */
            line-height: 1.8;
            color: #334155;
        }
        /* Headings */
        .rich-text-editor-wrapper .ql-editor h1 { font-size: 1.8em; font-weight: 700; margin-bottom: 0.5em; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.3em; }
        .rich-text-editor-wrapper .ql-editor h2 { font-size: 1.5em; font-weight: 600; margin-top: 1em; margin-bottom: 0.5em; }
        .rich-text-editor-wrapper .ql-editor h3 { font-size: 1.25em; font-weight: 600; margin-top: 1em; margin-bottom: 0.5em; }
        .rich-text-editor-wrapper .ql-editor p { margin-bottom: 1em; }

        /* Custom Toolbar Icons */
        .rich-text-editor-wrapper .ql-undo, 
        .rich-text-editor-wrapper .ql-redo {
            margin-left: 10px;
            cursor: pointer;
        }
        .rich-text-editor-wrapper .ql-undo:hover svg, 
        .rich-text-editor-wrapper .ql-redo:hover svg {
            stroke: #0f172a;
        }
        .rich-text-editor-wrapper .ql-editor .placeholder-token {
            background: #FEF3C7;
            color: #92400E;
            padding: 0 2px;
            border-radius: 2px;
        }
      `}</style>
      <div ref={containerRef} />
    </div>
  );
}
