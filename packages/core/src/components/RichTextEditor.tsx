import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

export default function RichTextEditor({ value, onChange, className, minHeight = "500px" }: { value: string; onChange: (html: string) => void; className?: string; minHeight?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isUpdatingRef = useRef(false);

  // Set css var
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--min-height', minHeight);
    }
  }, [minHeight]);

  useEffect(() => {
    if (quillRef.current || !containerRef.current) return;

    const quill = new Quill(containerRef.current, {
      theme: 'snow',
      placeholder: 'Start writing your policy...',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, 4, false] }],
          ['bold', 'italic', 'underline', 'strike', { 'color': [] }, { 'background': [] }],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'align': [] }],
          ['blockquote', 'code-block'],
          ['link'],
          ['clean']
        ]
      }
    });

    quill.on('text-change', (delta, oldDelta, source) => {
      if (source === 'user') {
        isUpdatingRef.current = true;
        const html = quill.root.innerHTML;
        onChange(html);
        isUpdatingRef.current = false;
      }
    });

    quillRef.current = quill;

    // Initial value
    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value);
    }
  }, []); // Mount once

  // Sync external value changes
  useEffect(() => {
    if (quillRef.current && value !== undefined && !isUpdatingRef.current) {
      const currentContent = quillRef.current.root.innerHTML;
      if (currentContent !== value) {
        quillRef.current.clipboard.dangerouslyPasteHTML(value);
      }
    }
  }, [value]);

  return (
    <div className={`rich-text-editor-wrapper bg-slate-50 p-4 rounded-lg border border-slate-200 ${className}`}>
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
        `}</style>
      <div ref={containerRef} />
    </div>
  );
}
