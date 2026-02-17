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

describe("Client Contact Information", () => {
  describe("updateContactInfo", () => {
    it("should allow admin to update contact information", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      // Create a client
      const client = await caller.clients.create({
        name: "Contact Info Test Client",
        industry: "Technology",
        size: "Medium",
        frameworks: "ISO 27001",
      });
      
      // Update contact info
      const result = await caller.clients.updateContactInfo({
        clientId: client.id,
        contactName: "John Smith",
        contactTitle: "CISO",
        contactEmail: "john.smith@example.com",
        contactPhone: "+1 555-123-4567",
        address: "123 Business St\nSuite 456\nNew York, NY 10001",
      });
      
      expect(result.success).toBe(true);
      expect(result.contactName).toBe("John Smith");
      expect(result.contactTitle).toBe("CISO");
      expect(result.contactEmail).toBe("john.smith@example.com");
      expect(result.contactPhone).toBe("+1 555-123-4567");
      expect(result.address).toContain("123 Business St");
    });

    it("should allow partial contact info updates", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const client = await caller.clients.create({
        name: "Partial Contact Test",
        industry: "Finance",
        size: "Large",
        frameworks: "SOC 2",
      });
      
      // Update only name and email
      const result = await caller.clients.updateContactInfo({
        clientId: client.id,
        contactName: "Jane Doe",
        contactEmail: "jane@example.com",
      });
      
      expect(result.success).toBe(true);
      expect(result.contactName).toBe("Jane Doe");
      expect(result.contactEmail).toBe("jane@example.com");
    });

    it("should reject non-admin users from updating contact info", async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);
      const userCtx = createUserContext();
      const userCaller = appRouter.createCaller(userCtx);
      
      const client = await adminCaller.clients.create({
        name: "Auth Test Client",
        industry: "Healthcare",
        size: "Small",
        frameworks: "ISO 27001",
      });
      
      await expect(
        userCaller.clients.updateContactInfo({
          clientId: client.id,
          contactName: "Unauthorized User",
        })
      ).rejects.toThrow();
    });

    it("should validate email format", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const client = await caller.clients.create({
        name: "Email Validation Test",
        industry: "Retail",
        size: "Medium",
        frameworks: "SOC 2",
      });
      
      // Invalid email should be rejected
      await expect(
        caller.clients.updateContactInfo({
          clientId: client.id,
          contactEmail: "not-a-valid-email",
        })
      ).rejects.toThrow();
    });

    it("should allow empty email to clear the field", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const client = await caller.clients.create({
        name: "Clear Email Test",
        industry: "Manufacturing",
        size: "Large",
        frameworks: "ISO 27001",
      });
      
      // Set email first
      await caller.clients.updateContactInfo({
        clientId: client.id,
        contactEmail: "test@example.com",
      });
      
      // Clear email with empty string
      const result = await caller.clients.updateContactInfo({
        clientId: client.id,
        contactEmail: "",
      });
      
      expect(result.success).toBe(true);
    });
  });
});
