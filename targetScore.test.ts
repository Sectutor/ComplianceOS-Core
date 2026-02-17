import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
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

describe('Target Compliance Score Feature', () => {
  let testClientId: number;

  beforeAll(async () => {
    const caller = appRouter.createCaller(createAdminContext());
    
    // Create a test client with target score
    const client = await caller.clients.create({
      name: 'Target Score Test Client',
      industry: 'Technology',
    });
    testClientId = client.id;
  });

  afterAll(async () => {
    if (testClientId) {
      const caller = appRouter.createCaller(createAdminContext());
      await caller.clients.delete({ id: testClientId });
    }
  });

  it('should create client with default target score of 80', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    
    const client = await caller.clients.create({
      name: 'Default Target Test Client',
      industry: 'Finance',
    });

    // Get the client to check targetComplianceScore
    const allClients = await caller.clients.list();
    const createdClient = allClients.find(c => c.id === client.id);
    
    expect(createdClient?.targetComplianceScore).toBe(80);
    
    // Clean up
    await caller.clients.delete({ id: client.id });
  });

  it('should update target compliance score via setTargetScore', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    
    // Update target score to 95
    const result = await caller.clients.setTargetScore({
      clientId: testClientId,
      targetScore: 95,
    });

    expect(result.success).toBe(true);
    expect(result.targetScore).toBe(95);
  });

  it('should retrieve client with updated target score', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    
    // First set a specific target
    await caller.clients.setTargetScore({
      clientId: testClientId,
      targetScore: 90,
    });
    
    // Get all clients and find our test client
    const allClients = await caller.clients.list();
    const client = allClients.find(c => c.id === testClientId);

    expect(client).toBeDefined();
    expect(client?.targetComplianceScore).toBe(90);
  });

  it('should allow target score of 0', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    
    const result = await caller.clients.setTargetScore({
      clientId: testClientId,
      targetScore: 0,
    });

    expect(result.success).toBe(true);
    expect(result.targetScore).toBe(0);
  });

  it('should allow target score of 100', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    
    const result = await caller.clients.setTargetScore({
      clientId: testClientId,
      targetScore: 100,
    });

    expect(result.success).toBe(true);
    expect(result.targetScore).toBe(100);
  });
});
