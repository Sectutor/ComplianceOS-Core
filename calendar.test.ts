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

describe("calendar router", () => {
  describe("calendar.events", () => {
    it("returns calendar events for a date range", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const result = await caller.calendar.events({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      expect(Array.isArray(result)).toBe(true);
      
      // If there are events, check their structure
      if (result.length > 0) {
        const event = result[0];
        expect(event).toHaveProperty("id");
        expect(event).toHaveProperty("type");
        expect(event).toHaveProperty("title");
        expect(event).toHaveProperty("description");
        expect(event).toHaveProperty("dueDate");
        expect(event).toHaveProperty("clientId");
        expect(event).toHaveProperty("clientName");
        expect(event).toHaveProperty("priority");
        expect(["control_review", "policy_renewal", "evidence_expiration"]).toContain(event.type);
        expect(["high", "medium", "low"]).toContain(event.priority);
      }
    });

    it("filters events by client when clientId is provided", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      const result = await caller.calendar.events({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        clientId: 1,
      });

      expect(Array.isArray(result)).toBe(true);
      
      // All events should belong to the specified client
      for (const event of result) {
        expect(event.clientId).toBe(1);
      }
    });
  });

  describe("calendar.upcoming", () => {
    it("returns upcoming deadlines within specified days", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.calendar.upcoming({
        days: 30,
      });

      expect(Array.isArray(result)).toBe(true);
      
      // All events should be within the next 30 days
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      for (const event of result) {
        const dueDate = new Date(event.dueDate);
        expect(dueDate.getTime()).toBeGreaterThanOrEqual(now.getTime());
        expect(dueDate.getTime()).toBeLessThanOrEqual(thirtyDaysFromNow.getTime());
      }
    });

    it("uses default of 30 days when days not specified", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.calendar.upcoming({});

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("calendar.overdue", () => {
    it("returns overdue items", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.calendar.overdue({});

      expect(Array.isArray(result)).toBe(true);
      
      // All events should have due dates in the past
      const now = new Date();
      for (const event of result) {
        const dueDate = new Date(event.dueDate);
        expect(dueDate.getTime()).toBeLessThan(now.getTime());
      }
    });

    it("filters overdue items by client when clientId is provided", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.calendar.overdue({
        clientId: 1,
      });

      expect(Array.isArray(result)).toBe(true);
      
      // All events should belong to the specified client
      for (const event of result) {
        expect(event.clientId).toBe(1);
      }
    });

    it("returns events with high priority", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.calendar.overdue({});

      // All overdue items should have high priority
      for (const event of result) {
        expect(event.priority).toBe("high");
      }
    });
  });
});
