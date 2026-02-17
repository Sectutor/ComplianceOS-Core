import { describe, expect, it } from "vitest";
import { generatePolicyDocx, generatePolicyHtml } from "./policyExport";

describe("policyExport", () => {
  const mockPolicy = {
    name: "Information Security Policy",
    content: `# Information Security Policy

## 1. Purpose
This policy establishes the framework for information security at **Test Company**.

## 2. Scope
- All employees
- All contractors
- All systems

### 2.1 Systems Covered
The following systems are covered:
1. Production servers
2. Development environments
3. Cloud infrastructure

## 3. Responsibilities
| Role | Responsibility |
|------|----------------|
| CISO | Overall security |
| IT Team | Implementation |
`,
    version: 1,
    clientName: "Test Company Inc",
    status: "approved",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-06-20"),
  };

  describe("generatePolicyDocx", () => {
    it("generates a valid docx buffer", async () => {
      const buffer = await generatePolicyDocx(mockPolicy);
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      // Check for DOCX magic bytes (PK zip header)
      expect(buffer[0]).toBe(0x50); // P
      expect(buffer[1]).toBe(0x4b); // K
    });

    it("handles empty content gracefully", async () => {
      const emptyPolicy = { ...mockPolicy, content: "" };
      const buffer = await generatePolicyDocx(emptyPolicy);
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("handles special characters in policy name", async () => {
      const specialPolicy = { ...mockPolicy, name: "Policy: Test & Review <2024>" };
      const buffer = await generatePolicyDocx(specialPolicy);
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe("generatePolicyHtml", () => {
    it("generates valid HTML with policy content", () => {
      const html = generatePolicyHtml(mockPolicy);
      
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html>");
      expect(html).toContain("</html>");
      expect(html).toContain(mockPolicy.name);
      expect(html).toContain(mockPolicy.clientName);
    });

    it("includes version and status in HTML", () => {
      const html = generatePolicyHtml(mockPolicy);
      
      expect(html).toContain("Version: 1");
      expect(html).toContain("Approved");
    });

    it("converts markdown headers to HTML", () => {
      const html = generatePolicyHtml(mockPolicy);
      
      expect(html).toContain("<h1>");
      expect(html).toContain("<h2>");
    });

    it("converts bold text to HTML strong tags", () => {
      const html = generatePolicyHtml(mockPolicy);
      
      expect(html).toContain("<strong>Test Company</strong>");
    });

    it("handles empty content gracefully", () => {
      const emptyPolicy = { ...mockPolicy, content: "" };
      const html = generatePolicyHtml(emptyPolicy);
      
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain(mockPolicy.name);
    });
  });
});
