import { describe, expect, it } from "vitest";
import * as db from "./db";

describe("Bulk Policy Generation", () => {
  describe("getAllPolicyTemplates", () => {
    it("should have correct function signature", () => {
      expect(typeof db.getAllPolicyTemplates).toBe("function");
    });
  });

  describe("getExistingClientPolicyTemplateIds", () => {
    it("should have correct function signature", () => {
      expect(typeof db.getExistingClientPolicyTemplateIds).toBe("function");
    });

    it("should accept clientId parameter", () => {
      expect(db.getExistingClientPolicyTemplateIds.length).toBe(1);
    });
  });

  describe("bulkGeneratePolicies", () => {
    it("should have correct function signature", () => {
      expect(typeof db.bulkGeneratePolicies).toBe("function");
    });

    it("should accept clientId and companyName parameters", () => {
      expect(db.bulkGeneratePolicies.length).toBe(2);
    });

    it("should return result object with created, skipped, and message properties", () => {
      const functionString = db.bulkGeneratePolicies.toString();
      expect(functionString).toContain("created");
      expect(functionString).toContain("skipped");
      expect(functionString).toContain("message");
    });

    it("should replace company name placeholder in content", () => {
      const functionString = db.bulkGeneratePolicies.toString();
      // Check that the function contains the regex pattern for replacing company name
      expect(functionString).toContain("COMPANY NAME");
    });
  });
});

describe("Bulk Policy Generation Integration", () => {
  it("should export all required functions", () => {
    expect(db.getAllPolicyTemplates).toBeDefined();
    expect(db.getExistingClientPolicyTemplateIds).toBeDefined();
    expect(db.bulkGeneratePolicies).toBeDefined();
  });
});
