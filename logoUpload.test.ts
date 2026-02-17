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

describe("Client Logo Upload", () => {
  describe("uploadLogo", () => {
    it("should allow admin to set logo URL for a client", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      // First create a client
      const client = await caller.clients.create({
        name: "Logo Test Company",
        industry: "Technology",
        size: "Medium",
        frameworks: "ISO 27001",
      });
      
      // Upload logo
      const result = await caller.clients.uploadLogo({
        clientId: client.id,
        logoUrl: "https://example.com/logos/test-logo.png",
      });
      
      expect(result.success).toBe(true);
      expect(result.logoUrl).toBe("https://example.com/logos/test-logo.png");
      
      // Verify the logo was saved
      const updatedClient = await caller.clients.get({ id: client.id });
      expect(updatedClient?.logoUrl).toBe("https://example.com/logos/test-logo.png");
    });

    it("should reject non-admin users from uploading logo", async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);
      const userCtx = createUserContext();
      const userCaller = appRouter.createCaller(userCtx);
      
      // Create client as admin
      const client = await adminCaller.clients.create({
        name: "Logo Test Company 2",
        industry: "Finance",
        size: "Large",
        frameworks: "SOC 2",
      });
      
      // Try to upload logo as regular user
      await expect(
        userCaller.clients.uploadLogo({
          clientId: client.id,
          logoUrl: "https://example.com/logos/unauthorized.png",
        })
      ).rejects.toThrow();
    });

    it("should validate logo URL format", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const client = await caller.clients.create({
        name: "Logo Validation Test",
        industry: "Healthcare",
        size: "Small",
        frameworks: "ISO 27001",
      });
      
      // Invalid URL should be rejected
      await expect(
        caller.clients.uploadLogo({
          clientId: client.id,
          logoUrl: "not-a-valid-url",
        })
      ).rejects.toThrow();
    });
  });

  describe("removeLogo", () => {
    it("should allow admin to remove logo from a client", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      // Create client with logo
      const client = await caller.clients.create({
        name: "Remove Logo Test",
        industry: "Retail",
        size: "Medium",
        frameworks: "ISO 27001",
      });
      
      // Set logo first
      await caller.clients.uploadLogo({
        clientId: client.id,
        logoUrl: "https://example.com/logos/to-remove.png",
      });
      
      // Remove logo
      const result = await caller.clients.removeLogo({
        clientId: client.id,
      });
      
      expect(result.success).toBe(true);
      
      // Verify logo was removed
      const updatedClient = await caller.clients.get({ id: client.id });
      expect(updatedClient?.logoUrl).toBeNull();
    });

    it("should reject non-admin users from removing logo", async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);
      const userCtx = createUserContext();
      const userCaller = appRouter.createCaller(userCtx);
      
      // Create client as admin
      const client = await adminCaller.clients.create({
        name: "Remove Logo Auth Test",
        industry: "Manufacturing",
        size: "Large",
        frameworks: "SOC 2",
      });
      
      // Set logo
      await adminCaller.clients.uploadLogo({
        clientId: client.id,
        logoUrl: "https://example.com/logos/protected.png",
      });
      
      // Try to remove logo as regular user
      await expect(
        userCaller.clients.removeLogo({
          clientId: client.id,
        })
      ).rejects.toThrow();
    });
  });
});
