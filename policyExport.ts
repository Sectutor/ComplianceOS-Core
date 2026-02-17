import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  TableOfContents,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from "docx";

interface PolicyExportData {
  name: string;
  content: string;
  version: number;
  clientName: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  policyLanguage?: string;
}

// Parse markdown-like content into docx paragraphs
function parseContentToParagraphs(content: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = content.split('\n');

  const inTable = false;
  const tableRows: string[][] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines but add spacing
    if (!trimmedLine) {
      paragraphs.push(new Paragraph({ text: "" }));
      continue;
    }

    // Handle headers
    if (trimmedLine.startsWith('# ')) {
      paragraphs.push(new Paragraph({
        text: trimmedLine.substring(2),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }));
    } else if (trimmedLine.startsWith('## ')) {
      paragraphs.push(new Paragraph({
        text: trimmedLine.substring(3),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      }));
    } else if (trimmedLine.startsWith('### ')) {
      paragraphs.push(new Paragraph({
        text: trimmedLine.substring(4),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      }));
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      // Bullet points
      paragraphs.push(new Paragraph({
        text: trimmedLine.substring(2),
        bullet: { level: 0 },
        spacing: { before: 50, after: 50 },
      }));
    } else if (/^\d+\.\s/.test(trimmedLine)) {
      // Numbered list
      const text = trimmedLine.replace(/^\d+\.\s/, '');
      paragraphs.push(new Paragraph({
        text: text,
        numbering: { reference: "default-numbering", level: 0 },
        spacing: { before: 50, after: 50 },
      }));
    } else if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      // Table row - skip table formatting rows (---) and just add as text
      if (!trimmedLine.includes('---')) {
        const cells = trimmedLine.split('|').filter(c => c.trim());
        const tableText = cells.join(' | ');
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: tableText,
              font: "Courier New",
              size: 20,
            }),
          ],
          spacing: { before: 50, after: 50 },
        }));
      }
    } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
      // Bold text
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: trimmedLine.slice(2, -2),
            bold: true,
          }),
        ],
        spacing: { before: 100, after: 100 },
      }));
    } else {
      // Regular paragraph - handle inline formatting
      const children: TextRun[] = [];
      const remaining = trimmedLine;

      // Simple inline bold handling
      const boldRegex = /\*\*([^*]+)\*\*/g;
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(trimmedLine)) !== null) {
        if (match.index > lastIndex) {
          children.push(new TextRun({
            text: trimmedLine.substring(lastIndex, match.index),
          }));
        }
        children.push(new TextRun({
          text: match[1],
          bold: true,
        }));
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < trimmedLine.length) {
        children.push(new TextRun({
          text: trimmedLine.substring(lastIndex),
        }));
      }

      if (children.length === 0) {
        children.push(new TextRun({ text: trimmedLine }));
      }

      paragraphs.push(new Paragraph({
        children,
        spacing: { before: 100, after: 100 },
      }));
    }
  }

  return paragraphs;
}

export async function generatePolicyDocx(policy: PolicyExportData): Promise<Buffer> {
  const contentParagraphs = parseContentToParagraphs(policy.content);

  // Localized labels
  const langCode = policy.policyLanguage || 'en';
  const labels: Record<string, { version: string; status: string; lastUpdated: string; page: string }> = {
    en: { version: 'Version', status: 'Status', lastUpdated: 'Last Updated', page: 'Page' },
    de: { version: 'Version', status: 'Status', lastUpdated: 'Zuletzt aktualisiert', page: 'Seite' },
    fr: { version: 'Version', status: 'Statut', lastUpdated: 'Dernière mise à jour', page: 'Page' },
    es: { version: 'Versión', status: 'Estado', lastUpdated: 'Última actualización', page: 'Página' },
    it: { version: 'Versione', status: 'Stato', lastUpdated: 'Ultimo aggiornamento', page: 'Pagina' },
    pt: { version: 'Versão', status: 'Estado', lastUpdated: 'Última atualização', page: 'Página' },
    nl: { version: 'Versie', status: 'Status', lastUpdated: 'Laatst bijgewerkt', page: 'Pagina' },
    pl: { version: 'Wersja', status: 'Status', lastUpdated: 'Ostatnia aktualizacja', page: 'Strona' },
    ja: { version: 'バージョン', status: 'ステータス', lastUpdated: '最終更新', page: 'ページ' },
    zh: { version: '版本', status: '状态', lastUpdated: '最后更新', page: '页' },
  };
  const l = labels[langCode] || labels.en;

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 24, // 12pt
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: policy.clientName,
                    size: 20,
                    color: "666666",
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${l.version} ${policy.version} | `,
                    size: 18,
                    color: "666666",
                  }),
                  new TextRun({
                    text: `${l.status}: ${policy.status} | ${l.page} `,
                    size: 18,
                    color: "666666",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: "666666",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: policy.name,
                bold: true,
                size: 48, // 24pt
                color: "0066CC",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          // Client name
          new Paragraph({
            children: [
              new TextRun({
                text: policy.clientName,
                size: 28,
                color: "666666",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          // Document info
          new Paragraph({
            children: [
              new TextRun({
                text: `${l.version}: ${policy.version} | ${l.status}: ${policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}`,
                size: 22,
                color: "888888",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${l.lastUpdated}: ${new Date(policy.updatedAt).toLocaleDateString()}`,
                size: 22,
                color: "888888",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),
          // Horizontal line (simulated)
          new Paragraph({
            children: [
              new TextRun({
                text: "─".repeat(80),
                color: "CCCCCC",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          // Content
          ...contentParagraphs,
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// Generate HTML for PDF conversion
export function generatePolicyHtml(policy: PolicyExportData): string {
  // Convert markdown-like content to HTML
  let htmlContent = policy.content
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap lists
  htmlContent = htmlContent.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      margin: 1in;
      @top-right {
        content: "${policy.clientName}";
        font-size: 10pt;
        color: #666;
      }
      @bottom-center {
        content: "Version ${policy.version} | Page " counter(page);
        font-size: 9pt;
        color: #666;
      }
    }
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #0066CC;
    }
    .title {
      font-size: 24pt;
      font-weight: bold;
      color: #0066CC;
      margin-bottom: 10px;
    }
    .client-name {
      font-size: 14pt;
      color: #666;
      margin-bottom: 10px;
    }
    .meta {
      font-size: 11pt;
      color: #888;
    }
    h1 { font-size: 18pt; color: #0066CC; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    h2 { font-size: 14pt; color: #333; margin-top: 25px; }
    h3 { font-size: 12pt; color: #444; margin-top: 20px; }
    p { margin: 10px 0; }
    ul, ol { margin: 10px 0 10px 20px; }
    li { margin: 5px 0; }
    table { border-collapse: collapse; width: 100%; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
    strong { font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${policy.name}</div>
    <div class="client-name">${policy.clientName}</div>
    <div class="meta">
      Version: ${policy.version} | Status: ${policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}<br>
      Last Updated: ${new Date(policy.updatedAt).toLocaleDateString()}
    </div>
  </div>
  <div class="content">
    <p>${htmlContent}</p>
  </div>
</body>
</html>`;
}
