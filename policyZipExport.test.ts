import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
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
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Policy ZIP Export", () => {
  describe("generatePoliciesZip", () => {
    it("should throw error for non-existent client", async () => {
      const { generatePoliciesZip } = await import("./policyZipExport");
      
      await expect(generatePoliciesZip(99999)).rejects.toThrow("Client not found");
    });

    it("should throw error when client has no policies", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      // Create a client with no policies
      const client = await caller.clients.create({
        name: "Empty Client for ZIP Test",
        industry: "Technology",
        size: "Small",
        frameworks: "ISO 27001",
      });
      
      const { generatePoliciesZip } = await import("./policyZipExport");
      
      await expect(generatePoliciesZip(client.id)).rejects.toThrow("No policies found for this client");
    });

    it("should export module functions correctly", async () => {
      const zipModule = await import("./policyZipExport");
      
      expect(typeof zipModule.generatePoliciesZip).toBe("function");
    });
  });
});
