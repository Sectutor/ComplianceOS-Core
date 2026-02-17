import { describe, expect, it, vi, beforeEach } from "vitest";
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

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
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

describe("controls router", () => {
  describe("controls.list", () => {
    it("returns an array of controls", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.controls.list({});
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("filters by framework when provided", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.controls.list({ framework: "ISO 27001" });
      
      expect(Array.isArray(result)).toBe(true);
      // All results should have ISO 27001 framework if any exist
      result.forEach(control => {
        if (control.framework) {
          expect(control.framework).toContain("ISO 27001");
        }
      });
    });
  });

  describe("dashboard.stats", () => {
    it("returns dashboard statistics", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.dashboard.stats();
      
      expect(result).toHaveProperty("totalClients");
      expect(result).toHaveProperty("totalControls");
      expect(result).toHaveProperty("totalPolicies");
      expect(result).toHaveProperty("totalEvidence");
      expect(typeof result.totalClients).toBe("number");
      expect(typeof result.totalControls).toBe("number");
    });
  });

  describe("clients.list", () => {
    it("returns an array of clients", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.clients.list();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("policyTemplates.list", () => {
    it("returns an array of policy templates", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.policyTemplates.list({});
      
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
