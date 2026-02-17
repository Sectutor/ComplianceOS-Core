import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "email",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("search router", () => {
  describe("search.global", () => {
    it("accepts valid search query", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // This will return empty results since no data exists, but validates the API works
      const result = await caller.search.global({ query: "test" });
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts query with custom limit", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.search.global({ query: "iso", limit: 10 });
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts query with framework filter", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.search.global({ 
        query: "access", 
        framework: "ISO 27001" 
      });
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts query with type filter", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.search.global({ 
        query: "policy", 
        type: "policy" 
      });
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts query with multiple filters", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.search.global({ 
        query: "security", 
        framework: "SOC 2",
        type: "control",
        status: "implemented"
      });
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("validates minimum query length", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.search.global({ query: "" })
      ).rejects.toThrow();
    });

    it("validates maximum limit", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.search.global({ query: "test", limit: 100 })
      ).rejects.toThrow();
    });
  });
});
