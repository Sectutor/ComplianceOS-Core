import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" = "admin"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("control implementation notes", () => {
  describe("clientControls.update", () => {
    it("accepts implementationNotes field", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      // First create a client and control to update
      const client = await caller.clients.create({
        name: "Test Notes Client",
        industry: "Technology",
      });
      
      const controls = await caller.controls.list();
      if (controls.length === 0) {
        // Skip if no controls exist
        return;
      }
      
      const clientControl = await caller.clientControls.create({
        clientId: client.id,
        controlId: controls[0].id,
      });
      
      // Update with implementation notes
      const result = await caller.clientControls.update({
        id: clientControl.id,
        implementationNotes: "This control was implemented using AWS IAM policies with MFA enforcement.",
        status: "implemented",
      });
      
      expect(result.success).toBe(true);
    });

    it("accepts implementationDate field", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const client = await caller.clients.create({
        name: "Test Date Client",
        industry: "Finance",
      });
      
      const controls = await caller.controls.list();
      if (controls.length === 0) {
        return;
      }
      
      const clientControl = await caller.clientControls.create({
        clientId: client.id,
        controlId: controls[0].id,
      });
      
      const implementationDate = new Date("2024-01-15");
      
      const result = await caller.clientControls.update({
        id: clientControl.id,
        implementationDate,
        status: "implemented",
      });
      
      expect(result.success).toBe(true);
    });

    it("allows updating multiple fields at once", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const client = await caller.clients.create({
        name: "Test Multi-field Client",
        industry: "Healthcare",
      });
      
      const controls = await caller.controls.list();
      if (controls.length === 0) {
        return;
      }
      
      const clientControl = await caller.clientControls.create({
        clientId: client.id,
        controlId: controls[0].id,
      });
      
      const result = await caller.clientControls.update({
        id: clientControl.id,
        implementationNotes: "Implemented via Azure AD with conditional access policies.",
        implementationDate: new Date("2024-02-20"),
        status: "implemented",
        owner: "Security Team",
        evidenceLocation: "https://sharepoint.com/evidence/control-123",
      });
      
      expect(result.success).toBe(true);
    });
  });

  describe("evidence.create", () => {
    it("creates evidence linked to a control", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const client = await caller.clients.create({
        name: "Test Evidence Client",
        industry: "Retail",
      });
      
      const controls = await caller.controls.list();
      if (controls.length === 0) {
        return;
      }
      
      const clientControl = await caller.clientControls.create({
        clientId: client.id,
        controlId: controls[0].id,
      });
      
      const evidence = await caller.evidence.create({
        clientId: client.id,
        clientControlId: clientControl.id,
        description: "Screenshot of MFA configuration",
        type: "Screenshot",
        location: "https://storage.example.com/evidence/mfa-config.png",
        owner: "IT Admin",
      });
      
      expect(evidence).toBeDefined();
      expect(evidence.id).toBeDefined();
    });
  });

  describe("evidence.list", () => {
    it("returns evidence for a client", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const client = await caller.clients.create({
        name: "Test Evidence List Client",
        industry: "Education",
      });
      
      const evidenceList = await caller.evidence.list({ clientId: client.id });
      
      expect(Array.isArray(evidenceList)).toBe(true);
    });
  });
});
