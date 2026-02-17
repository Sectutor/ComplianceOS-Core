import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
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

describe("dashboard router", () => {
  describe("dashboard.stats", () => {
    it("returns basic dashboard statistics", async () => {
      const ctx = createAuthContext();
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

  describe("dashboard.enhanced", () => {
    it("returns enhanced dashboard statistics with all sections", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.dashboard.enhanced();

      // Check overview section
      expect(result).toHaveProperty("overview");
      expect(result.overview).toHaveProperty("totalClients");
      expect(result.overview).toHaveProperty("totalControls");
      expect(result.overview).toHaveProperty("totalPolicies");
      expect(result.overview).toHaveProperty("totalEvidence");

      // Check controls by framework
      expect(result).toHaveProperty("controlsByFramework");
      expect(typeof result.controlsByFramework).toBe("object");
      // Note: Keys are now dynamic framework names (e.g., "ISO 27001"), not fixed keys ("iso27001")

      // Check controls by status
      expect(result).toHaveProperty("controlsByStatus");
      expect(result.controlsByStatus).toHaveProperty("notStarted");
      expect(result.controlsByStatus).toHaveProperty("inProgress");
      expect(result.controlsByStatus).toHaveProperty("implemented");
      expect(result.controlsByStatus).toHaveProperty("notApplicable");

      // Check policies by status
      expect(result).toHaveProperty("policiesByStatus");
      expect(result.policiesByStatus).toHaveProperty("draft");
      expect(result.policiesByStatus).toHaveProperty("review");
      expect(result.policiesByStatus).toHaveProperty("approved");
      expect(result.policiesByStatus).toHaveProperty("archived");

      // Check evidence by status
      expect(result).toHaveProperty("evidenceByStatus");
      expect(result.evidenceByStatus).toHaveProperty("pending");
      expect(result.evidenceByStatus).toHaveProperty("collected");
      expect(result.evidenceByStatus).toHaveProperty("verified");
      expect(result.evidenceByStatus).toHaveProperty("expired");

      // Check clients overview
      expect(result).toHaveProperty("clientsOverview");
      expect(Array.isArray(result.clientsOverview)).toBe(true);

      // Check recent activity
      expect(result).toHaveProperty("recentActivity");
      expect(Array.isArray(result.recentActivity)).toBe(true);
    });

    it("returns numeric values for all statistics", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.dashboard.enhanced();

      // All overview values should be numbers
      expect(typeof result.overview.totalClients).toBe("number");
      expect(typeof result.overview.totalControls).toBe("number");
      expect(typeof result.overview.totalPolicies).toBe("number");
      expect(typeof result.overview.totalEvidence).toBe("number");

      // Framework counts should be numbers (iterate values)
      Object.values(result.controlsByFramework).forEach(count => {
        expect(typeof count).toBe("number");
      });

      // All status counts should be numbers
      expect(typeof result.controlsByStatus.implemented).toBe("number");
      expect(typeof result.policiesByStatus.approved).toBe("number");
      expect(typeof result.evidenceByStatus.verified).toBe("number");
    });

    it("returns client overview with compliance percentage", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.dashboard.enhanced();

      // If there are clients, check their structure
      if (result.clientsOverview.length > 0) {
        const client = result.clientsOverview[0];
        expect(client).toHaveProperty("id");
        expect(client).toHaveProperty("name");
        expect(client).toHaveProperty("compliancePercentage");
        expect(client).toHaveProperty("controlsCount");
        expect(client).toHaveProperty("policiesCount");
        expect(client).toHaveProperty("evidenceCount");
        expect(typeof client.compliancePercentage).toBe("number");
        expect(client.compliancePercentage).toBeGreaterThanOrEqual(0);
        expect(client.compliancePercentage).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("dashboard.complianceScores", () => {
    it("returns an array of 7 months of scores", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.dashboard.complianceScores();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(7);
      expect(result[0]).toHaveProperty("date");
      expect(result[0]).toHaveProperty("score");
      expect(result[0]).toHaveProperty("target");
      expect(typeof result[0].score).toBe("number");
      expect(typeof result[0].target).toBe("number");
    });
  });
});
