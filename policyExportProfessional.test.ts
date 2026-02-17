import { describe, it, expect } from "vitest";
import { generateProfessionalDocx, generateProfessionalHtml } from "./policyExportProfessional";

describe("Professional Policy Export", () => {
  const mockPolicy = {
    name: "Access Control Policy",
    content: "## Purpose\n\nThis policy establishes access control requirements.\n\n## Scope\n\nThis policy applies to all systems.\n\n## Policy Statement\n\n- All users must authenticate\n- Access is based on least privilege\n- Regular access reviews required",
    sections: ["Purpose", "Scope", "Policy Statement", "Roles and Responsibilities"],
    version: 1,
    clientName: "Test Company Inc.",
    status: "approved",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-06-20"),
    templateId: "POL-ACC-001",
    framework: "ISO 27001 / SOC 2",
  };

  describe("generateProfessionalDocx", () => {
    it("should generate a valid DOCX buffer", async () => {
      const buffer = await generateProfessionalDocx(mockPolicy);
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should generate DOCX with valid ZIP signature (PK header)", async () => {
      const buffer = await generateProfessionalDocx(mockPolicy);
      
      // DOCX files are ZIP archives starting with PK signature
      expect(buffer[0]).toBe(0x50); // P
      expect(buffer[1]).toBe(0x4B); // K
    });

    it("should handle empty content gracefully", async () => {
      const emptyPolicy = { ...mockPolicy, content: "" };
      const buffer = await generateProfessionalDocx(emptyPolicy);
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should handle policy with no sections", async () => {
      const noSectionsPolicy = { ...mockPolicy, sections: [] };
      const buffer = await generateProfessionalDocx(noSectionsPolicy);
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe("generateProfessionalHtml", () => {
    it("should generate valid HTML with cover page", () => {
      const html = generateProfessionalHtml(mockPolicy);
      
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html>");
      expect(html).toContain("</html>");
      expect(html).toContain("cover-page");
    });

    it("should include policy name in title", () => {
      const html = generateProfessionalHtml(mockPolicy);
      
      expect(html).toContain("Access Control Policy");
    });

    it("should include client name", () => {
      const html = generateProfessionalHtml(mockPolicy);
      
      expect(html).toContain("Test Company Inc.");
    });

    it("should include document control section", () => {
      const html = generateProfessionalHtml(mockPolicy);
      
      expect(html).toContain("Document Control");
      expect(html).toContain("control-table");
    });

    it("should include table of contents", () => {
      const html = generateProfessionalHtml(mockPolicy);
      
      expect(html).toContain("Table of Contents");
      expect(html).toContain("toc-page");
    });

    it("should include approval section", () => {
      const html = generateProfessionalHtml(mockPolicy);
      
      expect(html).toContain("Document Approval");
      expect(html).toContain("Prepared By");
      expect(html).toContain("Reviewed By");
      expect(html).toContain("Approved By");
    });

    it("should include confidentiality notice", () => {
      const html = generateProfessionalHtml(mockPolicy);
      
      expect(html).toContain("CONFIDENTIAL");
    });

    it("should include version information", () => {
      const html = generateProfessionalHtml(mockPolicy);
      
      expect(html).toContain("Version 1.0");
    });

    it("should include framework information", () => {
      const html = generateProfessionalHtml(mockPolicy);
      
      expect(html).toContain("ISO 27001 / SOC 2");
    });

    it("should handle empty content", () => {
      const emptyPolicy = { ...mockPolicy, content: "" };
      const html = generateProfessionalHtml(emptyPolicy);
      
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Access Control Policy");
    });
  });
});
