import { describe, expect, it } from "vitest";
import * as db from "./db";

describe("Evidence Files", () => {
  describe("getEvidenceFiles", () => {
    it("should have correct function signature", () => {
      expect(typeof db.getEvidenceFiles).toBe("function");
    });

    it("should accept evidenceId parameter", () => {
      expect(db.getEvidenceFiles.length).toBe(1);
    });
  });

  describe("createEvidenceFile", () => {
    it("should have correct function signature", () => {
      expect(typeof db.createEvidenceFile).toBe("function");
    });

    it("should accept data parameter", () => {
      expect(db.createEvidenceFile.length).toBe(1);
    });
  });

  describe("deleteEvidenceFile", () => {
    it("should have correct function signature", () => {
      expect(typeof db.deleteEvidenceFile).toBe("function");
    });

    it("should accept id parameter", () => {
      expect(db.deleteEvidenceFile.length).toBe(1);
    });
  });

  describe("getEvidenceFileById", () => {
    it("should have correct function signature", () => {
      expect(typeof db.getEvidenceFileById).toBe("function");
    });

    it("should accept id parameter", () => {
      expect(db.getEvidenceFileById.length).toBe(1);
    });
  });
});

describe("Evidence Files Integration", () => {
  it("should export all required functions", () => {
    expect(db.getEvidenceFiles).toBeDefined();
    expect(db.createEvidenceFile).toBeDefined();
    expect(db.deleteEvidenceFile).toBeDefined();
    expect(db.getEvidenceFileById).toBeDefined();
  });
});
