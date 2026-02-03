import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { consents, consentTemplates, dsarTemplates, dpiaTemplates, dataFlowVisualizations, dataFlowNodes, dataFlowConnections } from "../../schema";
import { logActivity } from "../../lib/audit";
import * as db from "../../db";
import { getDb } from "../../db";
import { eq, and, desc, sql, inArray, like, or } from "drizzle-orm";

export const createPrivacyEnhancementsRouter = (t: any, clientProcedure: any, adminProcedure: any, publicProcedure: any, clientEditorProcedure: any) => {
  return t.router({

    // Consent Management
    consents: {
      list: clientProcedure
        .input(z.object({ clientId: z.number() }))
        .query(async ({ input, ctx }: any) => {
          const dbConn = await getDb();
          const consentsList = await dbConn.select()
            .from(consents)
            .where(eq(consents.clientId, input.clientId))
            .orderBy(desc(consents.createdAt));
          return consentsList;
        }),

      get: clientProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input, ctx }: any) => {
          const dbConn = await getDb();
          const consent = await dbConn.select()
            .from(consents)
            .where(eq(consents.id, input.id))
            .limit(1);
          
          if (!consent.length) throw new TRPCError({ code: "NOT_FOUND" });
          
          // Permission check
          if (ctx.user.role !== 'admin' && ctx.user.role !== 'owner') {
            const allowed = await db.isUserAllowedForClient(ctx.user.id, consent[0].clientId);
            if (!allowed) throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
          }
          
          return consent[0];
        }),

      create: clientEditorProcedure
        .input(z.object({
          clientId: z.number(),
          dataSubjectId: z.string(),
          consentType: z.enum(["marketing", "analytics", "functional", "third_party", "cookie"]),
          purpose: z.string(),
          legalBasis: z.string(),
          granularConsents: z.record(z.boolean()).optional(),
          ipAddress: z.string().optional(),
          userAgent: z.string().optional(),
          consentForm: z.string().optional(),
          expirationDate: z.string().optional(),
          retentionPeriod: z.number().default(2555),
          metadata: z.any().optional(),
        }))
        .mutation(async ({ input, ctx }: any) => {
          const dbConn = await getDb();
          
          const [newConsent] = await dbConn.insert(consents).values({
            clientId: input.clientId,
            dataSubjectId: input.dataSubjectId,
            consentType: input.consentType,
            purpose: input.purpose,
            legalBasis: input.legalBasis,
            granularConsents: input.granularConsents || {},
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
            consentForm: input.consentForm,
            expirationDate: input.expirationDate ? new Date(input.expirationDate) : null,
            retentionPeriod: input.retentionPeriod,
            metadata: input.metadata || {},
            status: 'active',
          }).returning();

          await logActivity(
            input.clientId,
            'consent_created',
            `Consent created for data subject ${input.dataSubjectId}`,
            ctx.user?.email || 'system'
          );

          return newConsent;
        }),

      withdraw: clientEditorProcedure
        .input(z.object({
          id: z.number(),
          withdrawalReason: z.string(),
        }))
        .mutation(async ({ input, ctx }: any) => {
          const dbConn = await getDb();
          
          // Check permission
          const consent = await dbConn.select()
            .from(consents)
            .where(eq(consents.id, input.id))
            .limit(1);
          
          if (!consent.length) throw new TRPCError({ code: "NOT_FOUND" });
          
          if (ctx.user.role !== 'admin' && ctx.user.role !== 'owner') {
            const allowed = await db.isUserAllowedForClient(ctx.user.id, consent[0].clientId);
            if (!allowed) throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
          }

          const [updatedConsent] = await dbConn.update(consents)
            .set({
              status: 'withdrawn',
              withdrawalTimestamp: new Date(),
              withdrawalReason: input.withdrawalReason,
            })
            .where(eq(consents.id, input.id))
            .returning();

          await logActivity(
            consent[0].clientId,
            'consent_withdrawn',
            `Consent withdrawn for data subject ${consent[0].dataSubjectId}`,
            ctx.user?.email || 'system'
          );

          return updatedConsent;
        }),
    },

    // Consent Templates
    consentTemplates: {
      list: clientProcedure
        .input(z.object({ clientId: z.number() }))
        .query(async ({ input, ctx }: any) => {
          const dbConn = await getDb();
          const templates = await dbConn.select()
            .from(consentTemplates)
            .where(and(
              eq(consentTemplates.clientId, input.clientId),
              eq(consentTemplates.isActive, true)
            ))
            .orderBy(desc(consentTemplates.createdAt));
          return templates;
        }),

      create: clientEditorProcedure
        .input(z.object({
          clientId: z.number(),
          name: z.string(),
          description: z.string().optional(),
          consentType: z.enum(["marketing", "analytics", "functional", "third_party", "cookie"]),
          templateContent: z.string(),
          granularOptions: z.array(z.object({
            id: z.string(),
            label: z.string(),
            required: z.boolean(),
          })).optional(),
          retentionPeriod: z.number().default(2555),
          version: z.string().default("1.0"),
        }))
        .mutation(async ({ input, ctx }: any) => {
          const dbConn = await getDb();
          
          const [newTemplate] = await dbConn.insert(consentTemplates).values({
            clientId: input.clientId,
            name: input.name,
            description: input.description,
            consentType: input.consentType,
            templateContent: input.templateContent,
            granularOptions: input.granularOptions || [],
            retentionPeriod: input.retentionPeriod,
            version: input.version,
            createdBy: ctx.user?.id,
          }).returning();

          await logActivity(
            input.clientId,
            'consent_template_created',
            `Consent template created: ${input.name}`,
            ctx.user?.email || 'system'
          );

          return newTemplate;
        }),
    },

    // DSAR Templates
    dsarTemplates: {
      list: clientProcedure
        .input(z.object({ clientId: z.number() }))
        .query(async ({ input, ctx }: any) => {
          const dbConn = await getDb();
          const templates = await dbConn.select()
            .from(dsarTemplates)
            .where(and(
              eq(dsarTemplates.clientId, input.clientId),
              eq(dsarTemplates.isActive, true)
            ))
            .orderBy(desc(dsarTemplates.usageCount));
          return templates;
        }),

      create: clientEditorProcedure
        .input(z.object({
          clientId: z.number(),
          name: z.string(),
          description: z.string().optional(),
          requestType: z.string(),
          templateContent: z.object({
            subject: z.string(),
            description: z.string(),
            verificationSteps: z.array(z.object({
              type: z.string(),
              label: z.string(),
              required: z.boolean(),
            })),
            dataCategories: z.array(z.object({
              category: z.string(),
              included: z.boolean(),
              description: z.string(),
            })),
          }),
        }))
        .mutation(async ({ input, ctx }: any) => {
          const dbConn = await getDb();
          
          const [newTemplate] = await dbConn.insert(dsarTemplates).values({
            clientId: input.clientId,
            name: input.name,
            description: input.description,
            requestType: input.requestType,
            templateContent: input.templateContent,
            createdBy: ctx.user?.id,
          }).returning();

          await logActivity(
            input.clientId,
            'dsar_template_created',
            `DSAR template created: ${input.name}`,
            ctx.user?.email || 'system'
          );

          return newTemplate;
        }),

      use: clientProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }: any) => {
          const dbConn = await getDb();
          
          const template = await dbConn.select()
            .from(dsarTemplates)
            .where(eq(dsarTemplates.id, input.id))
            .limit(1);
          
          if (!template.length) throw new TRPCError({ code: "NOT_FOUND" });

          await dbConn.update(dsarTemplates)
            .set({ usageCount: sql`${dsarTemplates.usageCount} + 1` })
            .where(eq(dsarTemplates.id, input.id));

          return template[0];
        }),
    },

    // DPIA Templates
    dpiaTemplates: {
      list: clientProcedure
        .input(z.object({ clientId: z.number() }))
        .query(async ({ input, ctx }: any) => {
          const dbConn = await getDb();
          const templates = await dbConn.select()
            .from(dpiaTemplates)
            .where(and(
              eq(dpiaTemplates.clientId, input.clientId),
              eq(dpiaTemplates.isActive, true)
            ))
            .orderBy(desc(dpiaTemplates.usageCount));
          return templates;
        }),

      create: clientEditorProcedure
        .input(z.object({
          clientId: z.number(),
          name: z.string(),
          description: z.string().optional(),
          category: z.string(),
          templateContent: z.object({
            screeningQuestions: z.array(z.object({
              id: z.string(),
              question: z.string(),
              type: z.enum(['boolean', 'text', 'select']),
              options: z.array(z.string()).optional(),
              required: z.boolean(),
            })),
            riskFactors: z.array(z.object({
              factor: z.string(),
              weight: z.number(),
              description: z.string(),
            })),
            mitigationMeasures: z.array(z.object({
              measure: z.string(),
              category: z.string(),
              description: z.string(),
            })),
          }),
        }))
        .mutation(async ({ input, ctx }: any) => {
          const dbConn = await getDb();
          
          const [newTemplate] = await dbConn.insert(dpiaTemplates).values({
            clientId: input.clientId,
            name: input.name,
            description: input.description,
            category: input.category,
            templateContent: input.templateContent,
            createdBy: ctx.user?.id,
          }).returning();

          await logActivity(
            input.clientId,
            'dpia_template_created',
            `DPIA template created: ${input.name}`,
            ctx.user?.email || 'system'
          );

          return newTemplate;
        }),
    },

    // Data Flow Visualization
    dataFlows: {
      list: clientProcedure
        .input(z.object({ clientId: z.number() }))
        .query(async ({ input, ctx }: any) => {
          const dbConn = await getDb();
          const flows = await dbConn.select()
            .from(dataFlowVisualizations)
            .where(and(
              eq(dataFlowVisualizations.clientId, input.clientId),
              eq(dataFlowVisualizations.isActive, true)
            ))
            .orderBy(desc(dataFlowVisualizations.createdAt));
          return flows;
        }),

      get: clientProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input, ctx }: any) => {
          const dbConn = await getDb();
          
          const flow = await dbConn.select()
            .from(dataFlowVisualizations)
            .where(eq(dataFlowVisualizations.id, input.id))
            .limit(1);
          
          if (!flow.length) throw new TRPCError({ code: "NOT_FOUND" });

          // Get nodes and connections for this flow
          const nodes = await dbConn.select()
            .from(dataFlowNodes)
            .where(eq(dataFlowNodes.flowId, input.id));
          
          const connections = await dbConn.select()
            .from(dataFlowConnections)
            .where(eq(dataFlowConnections.flowId, input.id));

          return {
            flow: flow[0],
            nodes,
            connections,
          };
        }),

      create: clientEditorProcedure
        .input(z.object({
          clientId: z.number(),
          name: z.string(),
          description: z.string().optional(),
          sourceSystem: z.string(),
          targetSystem: z.string(),
          dataType: z.string(),
          flowType: z.string(),
          processId: z.number().optional(),
          legalBasis: z.string().optional(),
          frequency: z.string().optional(),
          volume: z.string().optional(),
          securityMeasures: z.string().optional(),
          countries: z.array(z.object({
            country: z.string(),
            purpose: z.string(),
          })).optional(),
          flowMetadata: z.object({
            technologies: z.array(z.string()),
            protocols: z.array(z.string()),
            storageDuration: z.string(),
            retentionPeriod: z.string(),
          }).optional(),
        }))
        .mutation(async ({ input, ctx }: any) => {
          const dbConn = await getDb();
          
          const [newFlow] = await dbConn.insert(dataFlowVisualizations).values({
            clientId: input.clientId,
            name: input.name,
            description: input.description,
            sourceSystem: input.sourceSystem,
            targetSystem: input.targetSystem,
            dataType: input.dataType,
            flowType: input.flowType,
            processId: input.processId,
            legalBasis: input.legalBasis,
            frequency: input.frequency,
            volume: input.volume,
            securityMeasures: input.securityMeasures,
            countries: input.countries || [],
            flowMetadata: input.flowMetadata || {},
          }).returning();

          await logActivity(
            input.clientId,
            'data_flow_created',
            `Data flow created: ${input.name}`,
            ctx.user?.email || 'system'
          );

          return newFlow;
        }),

      // Auto-discovery automation
      discover: clientProcedure
        .input(z.object({
          clientId: z.number(),
          sourceSystem: z.string(),
          scanType: z.enum(['api', 'database', 'file_system']),
        }))
        .mutation(async ({ input, ctx }: any) => {
          // This is a simplified auto-discovery implementation
          // In production, this would connect to various systems to automatically discover data flows
          
          const discoveredFlows = [];
          
          // Simulate discovery logic based on scan type
          if (input.scanType === 'api') {
            // Mock API endpoint discovery
            discoveredFlows.push({
              name: `Auto-discovered: ${input.sourceSystem} API flows`,
              sourceSystem: input.sourceSystem,
              targetSystem: 'API Gateway',
              dataType: 'user_data',
              flowType: 'external',
              confidence: 0.85,
            });
          } else if (input.scanType === 'database') {
            // Mock database table discovery
            discoveredFlows.push({
              name: `Auto-discovered: ${input.sourceSystem} database connections`,
              sourceSystem: input.sourceSystem,
              targetSystem: 'Database Server',
              dataType: 'personal_data',
              flowType: 'internal',
              confidence: 0.90,
            });
          }

          return {
            discoveredCount: discoveredFlows.length,
            flows: discoveredFlows,
            timestamp: new Date().toISOString(),
          };
        }),
    },

    dataFlowNodes: {
      create: clientEditorProcedure
        .input(z.object({
          flowId: z.number(),
          nodeType: z.enum(['system', 'process', 'storage', 'person']),
          nodeName: z.string(),
          nodeDescription: z.string().optional(),
          nodeCategory: z.string().optional(),
          positionX: z.number().default(0),
          positionY: z.number().default(0),
          nodeMetadata: z.any().optional(),
        }))
        .mutation(async ({ input, ctx }: any) => {
          const dbConn = await getDb();
          
          const [newNode] = await dbConn.insert(dataFlowNodes).values({
            flowId: input.flowId,
            nodeType: input.nodeType,
            nodeName: input.nodeName,
            nodeDescription: input.nodeDescription,
            nodeCategory: input.nodeCategory,
            positionX: input.positionX,
            positionY: input.positionY,
            nodeMetadata: input.nodeMetadata || {},
          }).returning();

          return newNode;
        }),

      createConnection: clientEditorProcedure
        .input(z.object({
          flowId: z.number(),
          sourceNodeId: z.number(),
          targetNodeId: z.number(),
          connectionType: z.string(),
          dataType: z.string(),
          frequency: z.string().optional(),
          securityControls: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }: any) => {
          const dbConn = await getDb();
          
          const [newConnection] = await dbConn.insert(dataFlowConnections).values({
            flowId: input.flowId,
            sourceNodeId: input.sourceNodeId,
            targetNodeId: input.targetNodeId,
            connectionType: input.connectionType,
            dataType: input.dataType,
            frequency: input.frequency,
            securityControls: input.securityControls,
          }).returning();

          return newConnection;
        }),
    },
  });
};