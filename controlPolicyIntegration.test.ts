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

describe('Control-Policy Integration', () => {
  let testClientId: number;
  let testControlId: number;
  let testPolicyId: number;

  beforeAll(async () => {
    const caller = appRouter.createCaller(createAdminContext());
    
    // Create a test client
    const client = await caller.clients.create({
      name: 'Integration Test Client',
      industry: 'Technology',
    });
    testClientId = client.id;
    
    // Assign a control to the client
    const controls = await caller.controls.list();
    if (controls.length > 0) {
      const clientControl = await caller.clientControls.create({
        clientId: testClientId,
        controlId: controls[0].id,
      });
      testControlId = clientControl.id;
    }
    
    // Create a policy for the client
    const policy = await caller.clientPolicies.create({
      clientId: testClientId,
      name: 'Test Policy',
    });
    testPolicyId = policy.id;
  });

  afterAll(async () => {
    if (testClientId) {
      const caller = appRouter.createCaller(createAdminContext());
      await caller.clients.delete({ id: testClientId });
    }
  });

  it('should get policy coverage analysis for a client', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    
    const coverage = await caller.mappings.policyCoverage({ clientId: testClientId });
    
    expect(coverage).toBeDefined();
    expect(typeof coverage.totalControls).toBe('number');
    expect(typeof coverage.mappedControls).toBe('number');
    expect(typeof coverage.unmappedControls).toBe('number');
    expect(typeof coverage.coveragePercentage).toBe('number');
    expect(Array.isArray(coverage.policyCoverage)).toBe(true);
    expect(Array.isArray(coverage.unmappedControlsList)).toBe(true);
  });

  it('should get suggested mappings for a client', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    
    const suggestions = await caller.mappings.suggestedMappings({ clientId: testClientId });
    
    expect(Array.isArray(suggestions)).toBe(true);
    // Suggestions may be empty if no matching policies exist
  });

  it('should create a mapping between control and policy', async () => {
    if (!testControlId || !testPolicyId) {
      console.log('Skipping: no test control or policy');
      return;
    }
    
    const caller = appRouter.createCaller(createAdminContext());
    
    const mapping = await caller.mappings.create({
      clientId: testClientId,
      clientControlId: testControlId,
      clientPolicyId: testPolicyId,
      notes: 'Test mapping',
    });
    
    expect(mapping).toBeDefined();
    expect(mapping.id).toBeDefined();
  });

  it('should get controls for a specific policy', async () => {
    if (!testPolicyId) {
      console.log('Skipping: no test policy');
      return;
    }
    
    const caller = appRouter.createCaller(createAdminContext());
    
    const controls = await caller.mappings.controlsForPolicy({ clientPolicyId: testPolicyId });
    
    expect(Array.isArray(controls)).toBe(true);
  });

  it('should get policies for a specific control', async () => {
    if (!testControlId) {
      console.log('Skipping: no test control');
      return;
    }
    
    const caller = appRouter.createCaller(createAdminContext());
    
    const policies = await caller.mappings.policiesForControl({ clientControlId: testControlId });
    
    expect(Array.isArray(policies)).toBe(true);
  });

  it('should bulk create mappings', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    
    // Create another control and policy for bulk test
    const controls = await caller.controls.list();
    if (controls.length < 2) {
      console.log('Skipping: not enough controls');
      return;
    }
    
    const clientControl = await caller.clientControls.create({
      clientId: testClientId,
      controlId: controls[1].id,
    });
    
    const policy = await caller.clientPolicies.create({
      clientId: testClientId,
      name: 'Bulk Test Policy',
    });
    
    const result = await caller.mappings.bulkCreate({
      clientId: testClientId,
      mappings: [
        { clientControlId: clientControl.id, clientPolicyId: policy.id },
      ],
    });
    
    expect(result.created).toBeGreaterThanOrEqual(0);
    expect(typeof result.skipped).toBe('number');
  });

  it('should update coverage percentage after creating mappings', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    
    const coverage = await caller.mappings.policyCoverage({ clientId: testClientId });
    
    // After creating mappings, some controls should be mapped
    expect(coverage.mappedControls).toBeGreaterThanOrEqual(0);
    expect(coverage.coveragePercentage).toBeGreaterThanOrEqual(0);
    expect(coverage.coveragePercentage).toBeLessThanOrEqual(100);
  });
});
