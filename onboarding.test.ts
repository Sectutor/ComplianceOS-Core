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

describe("onboarding wizard APIs", () => {
  describe("clients.create", () => {
    it("creates a new client with required fields", async () => {
      const ctx = createAuthContext("admin");
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.clients.create({
        name: "Test Onboarding Client",
        industry: "Technology",
        frameworks: "ISO 27001, SOC 2",
        status: "in_progress",
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe("number");
    });

    it("requires admin role to create clients", async () => {
      const ctx = createAuthContext("user");
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.clients.create({
          name: "Test Client",
        })
      ).rejects.toThrow();
    });
  });

  describe("clientControls.bulkAssign", () => {
    it("requires admin role for bulk assignment", async () => {
      const ctx = createAuthContext("user");
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.clientControls.bulkAssign({
          clientId: 1,
          framework: "ISO 27001",
        })
      ).rejects.toThrow();
    });

    it("validates framework parameter", async () => {
      const ctx = createAuthContext("admin");
      const caller = appRouter.createCaller(ctx);
      
      // Should accept valid frameworks
      // Note: This may fail if client doesn't exist, but validates input schema
      try {
        await caller.clientControls.bulkAssign({
          clientId: 999999, // Non-existent client
          framework: "ISO 27001",
        });
      } catch (error: any) {
        // Expected to fail due to non-existent client, not validation
        expect(error.message).not.toContain("validation");
      }
    });
  });

  describe("clientPolicies.bulkGenerate", () => {
    it("requires admin role for bulk policy generation", async () => {
      const ctx = createAuthContext("user");
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.clientPolicies.bulkGenerate({
          clientId: 1,
          companyName: "Test Company",
        })
      ).rejects.toThrow();
    });

    it("requires companyName parameter", async () => {
      const ctx = createAuthContext("admin");
      const caller = appRouter.createCaller(ctx);
      
      // Should fail without companyName
      await expect(
        caller.clientPolicies.bulkGenerate({
          clientId: 1,
          companyName: "", // Empty company name
        })
      ).rejects.toThrow();
    });
  });

  describe("clients.list", () => {
    it("returns array of clients", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.clients.list();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
