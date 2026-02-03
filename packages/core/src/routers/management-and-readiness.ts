import { z } from "zod";
import { getDb } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";
import { approvalRequests, approvalSignatures, users } from "../schema";
export const createManagementRouter = (t: any, protectedProcedure: any) => {
  return t.router({
    // Get all pending approvals for a client
    getApprovals: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        status: z.enum(['pending', 'approved', 'rejected', 'all']).optional().default('all')
      }))
      .query(async ({ input }) => {
        const { clientId, status } = input;

        const db = await getDb();
        let query = db.select({
          request: approvalRequests,
          submitter: users
        })
          .from(approvalRequests)
          .leftJoin(users, eq(approvalRequests.submitterId, users.id))
          .where(eq(approvalRequests.clientId, clientId))
          .orderBy(desc(approvalRequests.createdAt));

        const results = await query;

        // Fetch signatures for these requests
        const requestIds = results.map(r => r.request.id);
        const signaturesMap = new Map();

        if (requestIds.length > 0) {
          // Fetch signatures
          // Note: In Drizzle, whereIn with empty array can be tricky, check length first
          // Actually, let's just loop for now or fetch all for client (safer optimization later)
          const allSignatures = await db.select({
            sig: approvalSignatures,
            signer: users
          })
            .from(approvalSignatures)
            .leftJoin(users, eq(approvalSignatures.signerId, users.id))
            .where(sql`request_id IN ${requestIds}`);

          allSignatures.forEach(({ sig, signer }) => {
            if (!signaturesMap.has(sig.requestId)) {
              signaturesMap.set(sig.requestId, []);
            }
            signaturesMap.get(sig.requestId).push({
              id: sig.id.toString(),
              signerId: sig.signerId.toString(),
              signerName: signer?.name || "Unknown",
              signerRole: sig.signerRole,
              signature: sig.signatureData || "",
              timestamp: sig.signedAt?.toISOString() || new Date().toISOString(),
              status: sig.status || 'signed',
              comment: sig.comment || ""
            });
          });
        }

        const approvals = results.map(({ request, submitter }) => ({
          id: request.id.toString(),
          title: request.title,
          type: request.entityType as any,
          description: request.description || "",
          status: request.status || "pending",
          submitter: submitter?.name || "Unknown",
          submittedDate: request.submittedAt?.toISOString().split('T')[0] || "",
          requiredApprovers: request.requiredRoles || [],
          currentApprover: "Pending", // Simplification
          signatures: signaturesMap.get(request.id) || [],
          metadata: { entityId: request.entityId }
        }));

        if (status !== 'all') {
          return approvals.filter(item => item.status === status);
        }

        return approvals;
      }),

    // Submit an approval request
    submitApproval: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        title: z.string(),
        type: z.enum(['risk-treatment', 'soa', 'policy']),
        description: z.string(),
        requiredApprovers: z.array(z.string()),
        content: z.string().optional(),
        metadata: z.record(z.any()).optional()
      }))
      .mutation(async ({ input }) => {
        const { clientId, title, type, description, requiredApprovers, content, metadata } = input;

        // TODO: Get real user ID from context. Assuming 1 for now if not available
        const submitterId = 1;

        const [newRequest] = await db.insert(approvalRequests).values({
          clientId,
          title,
          entityType: type,
          entityId: 0, // Placeholder if no entity linked yet
          description,
          status: 'pending',
          submitterId,
          requiredRoles: requiredApprovers,
        }).returning();

        return {
          ...newRequest,
          id: newRequest.id.toString()
        };
      }),

    // Approve or reject a document
    processApproval: protectedProcedure
      .input(z.object({
        approvalId: z.string(),
        action: z.enum(['approve', 'reject']),
        comment: z.string().optional(),
        signature: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const { approvalId, action, comment, signature } = input;
        const userId = 1; // TODO: Get from context

        // 1. Add signature record
        await db.insert(approvalSignatures).values({
          requestId: parseInt(approvalId),
          signerId: userId,
          signerRole: "Authorized User", // Should come from user role
          status: action === 'approve' ? 'signed' : 'rejected',
          comment,
          signatureData: signature
        });

        // 2. Update request status
        // Logic: specific rejection -> rejected immediately
        // Logic: approval -> check if all required roles have signed (skipping complex logic for now, just marking approved)
        const newStatus = action === 'approve' ? 'approved' : 'rejected';

        const [updated] = await db.update(approvalRequests)
          .set({
            status: newStatus,
            updatedAt: new Date()
          })
          .where(eq(approvalRequests.id, parseInt(approvalId)))
          .returning();

        return updated;
      }),

    // Get approval history
    getHistory: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0)
      }))
      .query(async ({ input }) => {
        const { clientId, limit, offset } = input;

        // Mock implementation - fetch approval history from database
        const history = [
          {
            id: '1',
            title: 'Risk Treatment Plan - Q1 2024',
            type: 'risk-treatment',
            action: 'approved',
            approver: 'John Smith (CISO)',
            approvedDate: '2024-01-12T10:30:00Z',
            comment: 'Reviewed and approved all controls'
          }
        ];

        return history.slice(offset, offset + limit);
      })
  });
};

export const createReadinessRouterV2 = (t: any, protectedProcedure: any) => {
  return t.router({
    // Get readiness assessments for a client
    getAssessments: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        framework: z.enum(['SOC2', 'ISO27001', 'NIST80053', 'CMMC', 'HIPAA']).optional()
      }))
      .query(async ({ input }) => {
        const { clientId, framework } = input;

        // Mock implementation - fetch assessments from database
        const assessments = [
          {
            id: 'assessment_1',
            framework: 'SOC2',
            status: 'in-progress',
            readinessScore: 75,
            targetScore: 85,
            lastUpdated: '2024-01-15T10:30:00Z',
            gapAnalysis: [],
            roadmap: [],
            recommendations: []
          }
        ];

        if (framework) {
          return assessments.filter(a => a.framework === framework);
        }
        return assessments;
      }),

    // Create or update readiness assessment
    saveAssessment: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        framework: z.enum(['SOC2', 'ISO27001', 'NIST80053', 'CMMC', 'HIPAA']),
        status: z.enum(['in-progress', 'ready', 'needs-work']),
        readinessScore: z.number(),
        targetScore: z.number(),
        gapAnalysis: z.array(z.object({
          id: z.string(),
          domain: z.string(),
          control: z.string(),
          requirement: z.string(),
          currentStatus: z.enum(['implemented', 'partial', 'not-implemented']),
          evidence: z.enum(['sufficient', 'partial', 'missing']),
          riskLevel: z.enum(['high', 'medium', 'low']),
          effort: z.enum(['high', 'medium', 'low']),
          priority: z.number()
        })),
        roadmap: z.array(z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
          targetDate: z.string(),
          status: z.enum(['pending', 'in-progress', 'completed']),
          dependencies: z.array(z.string()),
          assignee: z.string().optional(),
          progress: z.number()
        })),
        recommendations: z.array(z.string()),
        responses: z.record(z.string()), // Assessment question responses
        evidenceNotes: z.record(z.string()) // Evidence notes for each question
      }))
      .mutation(async ({ input }) => {
        const { clientId, ...assessmentData } = input;

        // Mock implementation - save assessment to database
        const assessment = {
          id: `assessment_${Date.now()}`,
          clientId,
          ...assessmentData,
          lastUpdated: new Date().toISOString()
        };

        return assessment;
      }),

    // Get framework-specific questions
    getFrameworkQuestions: protectedProcedure
      .input(z.object({
        framework: z.enum(['SOC2', 'ISO27001', 'NIST80053', 'CMMC', 'HIPAA'])
      }))
      .query(async ({ input }) => {
        const { framework } = input;

        // Mock implementation - return framework-specific questions
        const questions = {
          SOC2: [
            {
              id: '1',
              domain: 'Security',
              question: 'Does your organization have a documented information security policy?',
              importance: 'high',
              evidence: ['Written policy document', 'Policy approval records', 'Policy distribution records']
            }
          ],
          ISO27001: [
            {
              id: '1',
              domain: 'Leadership',
              question: 'Has top management demonstrated leadership and commitment to information security?',
              importance: 'high',
              evidence: ['Information security policy', 'Security objectives', 'Management review meetings']
            }
          ]
        };

        return questions[framework] || [];
      }),

    // Generate roadmap from gap analysis
    generateRoadmap: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        gapAnalysis: z.array(z.object({
          id: z.string(),
          domain: z.string(),
          control: z.string(),
          requirement: z.string(),
          currentStatus: z.enum(['implemented', 'partial', 'not-implemented']),
          evidence: z.enum(['sufficient', 'partial', 'missing']),
          riskLevel: z.enum(['high', 'medium', 'low']),
          effort: z.enum(['high', 'medium', 'low']),
          priority: z.number()
        }))
      }))
      .mutation(async ({ input }) => {
        const { clientId, gapAnalysis } = input;

        // Mock implementation - generate roadmap from gaps
        const domains = [...new Set(gapAnalysis.map(gap => gap.domain))];
        const currentDate = new Date();

        const roadmap = domains.map((domain, index) => {
          const domainGaps = gapAnalysis.filter(gap => gap.domain === domain);
          const targetDate = new Date(currentDate);
          targetDate.setMonth(currentDate.getMonth() + (index + 1) * 2);

          return {
            id: `milestone_${index}`,
            title: `${domain} Implementation`,
            description: `Implement ${domainGaps.length} controls in ${domain} domain`,
            targetDate: targetDate.toISOString().split('T')[0],
            status: 'pending' as const,
            dependencies: index > 0 ? [`milestone_${index - 1}`] : [],
            progress: 0
          };
        });

        return roadmap;
      }),

    // Get readiness score trends
    getScoreTrends: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        framework: z.enum(['SOC2', 'ISO27001', 'NIST80053', 'CMMC', 'HIPAA']),
        period: z.enum(['1M', '3M', '6M', '1Y']).optional().default('6M')
      }))
      .query(async ({ input }) => {
        const { clientId, framework, period } = input;

        // Mock implementation - return score trend data
        const trends = [
          { date: '2023-12-01', score: 65 },
          { date: '2024-01-01', score: 75 },
          { date: '2024-02-01', score: 82 }
        ];

        return trends;
      })
  });
};