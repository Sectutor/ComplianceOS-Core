import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { generateComplianceReadinessReport } from './complianceReport';

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

describe('Compliance Readiness Report', () => {
  let testClientId: number;

  beforeAll(async () => {
    const caller = appRouter.createCaller(createAdminContext());
    
    // Create a test client
    const client = await caller.clients.create({
      name: 'Report Test Client',
      industry: 'Technology',
    });
    testClientId = client.id;
    
    // Assign some controls
    const controls = await caller.controls.list();
    if (controls.length > 0) {
      await caller.clientControls.create({
        clientId: testClientId,
        controlId: controls[0].id,
      });
    }
    
    // Create a policy
    await caller.clientPolicies.create({
      clientId: testClientId,
      name: 'Test Policy for Report',
    });
  });

  afterAll(async () => {
    if (testClientId) {
      const caller = appRouter.createCaller(createAdminContext());
      await caller.clients.delete({ id: testClientId });
    }
  });

  it('should generate a PDF report for a valid client', async () => {
    const pdfBuffer = await generateComplianceReadinessReport(testClientId);
    
    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    
    // Check PDF magic bytes
    const pdfHeader = pdfBuffer.slice(0, 5).toString();
    expect(pdfHeader).toBe('%PDF-');
  });

  it('should throw error for non-existent client', async () => {
    await expect(generateComplianceReadinessReport(999999)).rejects.toThrow('Client not found');
  });

  it('should include client name in PDF metadata', async () => {
    const pdfBuffer = await generateComplianceReadinessReport(testClientId);
    const pdfString = pdfBuffer.toString('utf-8');
    
    // PDF should contain the client name somewhere
    expect(pdfString).toContain('Report Test Client');
  });

  it('should generate report with correct structure', async () => {
    const pdfBuffer = await generateComplianceReadinessReport(testClientId);
    const pdfString = pdfBuffer.toString('utf-8');
    
    // PDF content is compressed, but metadata is readable
    // Check for PDF metadata which contains the title
    expect(pdfString).toContain('Compliance Readiness Report');
    expect(pdfString).toContain('Compliance OS'); // Author
  });

  it('should handle client with no controls gracefully', async () => {
    const caller = appRouter.createCaller(createAdminContext());
    
    // Create a client with no controls
    const emptyClient = await caller.clients.create({
      name: 'Empty Client',
      industry: 'Test',
    });
    
    try {
      const pdfBuffer = await generateComplianceReadinessReport(emptyClient.id);
      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer).toBeInstanceOf(Buffer);
    } finally {
      await caller.clients.delete({ id: emptyClient.id });
    }
  });
});
