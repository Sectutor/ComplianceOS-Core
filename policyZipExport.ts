import archiver from "archiver";
import { Writable } from "stream";
import * as db from "./packages/core/src/db";
import { generateProfessionalDocx, generateProfessionalHtml } from "./packages/core/src/policyExportProfessional";

interface PolicyExportItem {
  id: number;
  name: string;
  content: string;
  version: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  templateId?: string;
  framework?: string;
  sections: string[];
}

/**
 * Generate a ZIP file containing all policies for a client
 * Each policy is exported as both DOCX and PDF-ready HTML
 */
export async function generatePoliciesZip(clientId: number): Promise<Buffer> {
  // Get client info
  const client = await db.getClientById(clientId);
  if (!client) {
    throw new Error("Client not found");
  }

  // Get all policies for the client
  const policies = await db.getClientPolicies(clientId);

  if (!policies || policies.length === 0) {
    throw new Error("No policies found for this client");
  }

  // Create a buffer to store the ZIP
  const chunks: Buffer[] = [];
  const writableStream = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(chunk);
      callback();
    },
  });

  // Create archive
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Maximum compression
  });

  // Pipe archive to writable stream
  archive.pipe(writableStream);

  // Process each policy
  for (const policyData of policies) {
    const policy = policyData.clientPolicy;
    const template = policyData.template;

    // Sanitize policy name for filename
    const safeName = policy.name.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_");
    const folderName = `${safeName}_v${policy.version}`;

    // Prepare export data
    const exportData = {
      name: policy.name,
      content: policy.content || "",
      sections: (template?.sections as string[]) || [],
      version: policy.version,
      clientName: client.name,
      status: policy.status,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
      templateId: template?.templateId,
      framework: template?.framework,
      logoUrl: client.logoUrl,
      contactName: client.contactName,
      contactTitle: client.contactTitle,
      contactEmail: client.contactEmail,
      contactPhone: client.contactPhone,
      address: client.address,
    };

    try {
      // Generate DOCX
      const docxBuffer = await generateProfessionalDocx(exportData);
      archive.append(docxBuffer, { name: `${folderName}/${safeName}.docx` });

      // Generate HTML (for PDF printing)
      const html = generateProfessionalHtml(exportData);
      archive.append(html, { name: `${folderName}/${safeName}_print.html` });
    } catch (error) {
      console.error(`Error exporting policy ${policy.name}:`, error);
      // Continue with other policies even if one fails
    }
  }

  // Add a README file
  const readme = generateReadme(client.name, policies.length);
  archive.append(readme, { name: "README.txt" });

  // Finalize and wait for completion
  return new Promise<Buffer>((resolve, reject) => {
    writableStream.on("finish", () => {
      resolve(Buffer.concat(chunks));
    });
    writableStream.on("error", reject);
    archive.on("error", reject);
    archive.finalize();
  });
}

function generateReadme(clientName: string, policyCount: number): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
================================================================================
                        POLICY DOCUMENT EXPORT
================================================================================

Client: ${clientName}
Export Date: ${date}
Total Policies: ${policyCount}

--------------------------------------------------------------------------------
CONTENTS
--------------------------------------------------------------------------------

This ZIP archive contains all compliance policies for ${clientName}.

Each policy folder contains:
  - [PolicyName].docx    - Microsoft Word document (editable)
  - [PolicyName]_print.html - HTML version for PDF printing

--------------------------------------------------------------------------------
INSTRUCTIONS
--------------------------------------------------------------------------------

To create PDF versions:
1. Open the _print.html file in a web browser
2. Press Ctrl+P (or Cmd+P on Mac)
3. Select "Save as PDF" as the destination
4. Click Save

The HTML files are formatted for professional printing with:
- Cover page with company branding
- Table of contents
- Document control information
- Page numbers and headers/footers

--------------------------------------------------------------------------------
CONFIDENTIALITY NOTICE
--------------------------------------------------------------------------------

These documents contain confidential information belonging to ${clientName}.
Unauthorized distribution, copying, or disclosure is strictly prohibited.

================================================================================
                    Generated by Compliance OS
================================================================================
`.trim();
}
