import { z } from "zod";
import { router } from "../trpc";
import * as db from "../../db";
import { essentialEightAssessments } from "../../schema";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const createEssentialEightRouter = (t: any, clientProcedure: any) => {
  async function ensureTables(dbConn: any) {
    try {
      // Check if table exists using regclass to avoid exception if it exists
      await dbConn.execute(sql`SELECT 'essential_eight_assessments'::regclass`);
    } catch (e: any) {
      // If it throws, it likely doesn't exist (or permission error)
      console.log("[EssentialEight] Table essential_eight_assessments missing, attempting to create...");
      
      try {
        await dbConn.execute(sql`
          CREATE TABLE IF NOT EXISTS "essential_eight_assessments" (
            "id" SERIAL PRIMARY KEY,
            "client_id" INTEGER NOT NULL,
            "control_id" VARCHAR(80) NOT NULL,
            "maturity_level" INTEGER DEFAULT 0 NOT NULL,
            "target_level" INTEGER DEFAULT 1 NOT NULL,
            "assessment_answers" JSONB DEFAULT '{}'::jsonb,
            "quality_criteria" JSONB DEFAULT '{}'::jsonb,
            "level_notes" JSONB DEFAULT '{}'::jsonb,
            "outcome" VARCHAR(30) DEFAULT 'not_assessed' NOT NULL,
            "evidence_quality" VARCHAR(20) DEFAULT 'poor' NOT NULL,
            "evidence_quality_by_level" JSONB DEFAULT '{}'::jsonb,
            "sample_coverage" JSONB DEFAULT '{}'::jsonb,
            "compensating_controls" JSONB DEFAULT '[]'::jsonb,
            "evidence_links" JSONB DEFAULT '[]'::jsonb,
            "notes" TEXT,
            "updated_at" TIMESTAMP DEFAULT NOW(),
            "created_at" TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log("[EssentialEight] Table created successfully.");
        
        await dbConn.execute(sql`
          CREATE UNIQUE INDEX IF NOT EXISTS "idx_e8_client_control" ON "essential_eight_assessments" ("client_id", "control_id")
        `);
        console.log("[EssentialEight] Index created successfully.");
      } catch (createError: any) {
        console.error("[EssentialEight] Failed to create table:", createError);
        // If it's an "already exists" error (race condition), ignore it
        if (!createError.message?.toLowerCase().includes("already exists")) {
          throw createError;
        }
      }
    }
  }

  return t.router({
    listAssessments: clientProcedure
      .input(z.object({ clientId: z.number().optional() }))
      .query(async ({ input, ctx }: { input: { clientId?: number }, ctx: any }) => {
        const clientId = ctx.clientId ?? input.clientId;
        if (!clientId) throw new TRPCError({ code: "BAD_REQUEST", message: "Missing clientId" });
        const dbConn = await db.getDb();
        await ensureTables(dbConn);
        return dbConn
          .select()
          .from(essentialEightAssessments)
          .where(eq(essentialEightAssessments.clientId, clientId));
      }),

    calculateOverallScore: clientProcedure
      .input(z.object({ clientId: z.number().optional() }))
      .query(async ({ input, ctx }: { input: { clientId?: number }, ctx: any }) => {
        const clientId = ctx.clientId ?? input.clientId;
        if (!clientId) throw new TRPCError({ code: "BAD_REQUEST", message: "Missing clientId" });
        const dbConn = await db.getDb();
        await ensureTables(dbConn);
        const rows = await dbConn
          .select()
          .from(essentialEightAssessments)
          .where(eq(essentialEightAssessments.clientId, clientId));
        const total = rows.length;
        const sum = rows.reduce((acc: number, r: any) => acc + (r.maturityLevel || 0), 0);
        const targetSum = rows.reduce((acc: number, r: any) => acc + (r.targetLevel || 0), 0);
        return {
          overallScore: total ? sum / total : 0,
          overallTarget: total ? targetSum / total : 1,
        };
      }),
    getMaturity: clientProcedure
      .input(z.object({ clientId: z.number().optional() }))
      .query(async ({ input, ctx }: { input: { clientId?: number }, ctx: any }) => {
        const clientId = ctx.clientId ?? input.clientId;
        if (!clientId) throw new TRPCError({ code: "BAD_REQUEST", message: "Missing clientId" });
        const dbConn = await db.getDb();
        await ensureTables(dbConn);
        const scores = await dbConn
          .select()
          .from(essentialEightAssessments)
          .where(eq(essentialEightAssessments.clientId, clientId));
        return scores;
      }),

    updateMaturity: clientProcedure
      .input(
        z.object({
          clientId: z.number(),
          controlId: z.string(),
          maturityLevel: z.number().min(0).max(3).optional(),
          targetLevel: z.number().min(0).max(3).optional(),
          assessmentAnswers: z.record(z.string(), z.boolean()).optional(),
          qualityCriteria: z.record(z.string(), z.record(z.string(), z.boolean())).optional(),
          levelNotes: z.record(z.string(), z.string()).optional(),
          outcome: z.enum(["not_assessed","effective","alternate_control","ineffective","no_visibility","not_implemented","not_applicable"]).optional(),
          evidenceQuality: z.enum(["excellent","good","fair","poor"]).optional(),
          evidenceQualityByLevel: z.record(z.string(), z.enum(["excellent","good","fair","poor"])).optional(),
          sampleCoverage: z.object({ workstations: z.number().optional(), servers: z.number().optional(), networkDevices: z.number().optional() }).optional(),
          compensatingControls: z.array(z.object({ description: z.string(), acceptedBy: z.string().optional(), date: z.string().optional() })).optional(),
          evidenceLinks: z.array(z.number()).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }: { input: any, ctx: any }) => {
        const dbConn = await db.getDb();
        const clientId = ctx.clientId ?? input.clientId;
        const { controlId, ...updates } = input;
        if (!clientId) throw new TRPCError({ code: "BAD_REQUEST", message: "Missing clientId" });
        
        // Ensure tables exist before trying to update
        await ensureTables(dbConn);

        let existing: any[] = [];
        try {
          existing = await dbConn
            .select()
            .from(essentialEightAssessments)
            .where(
              and(
                eq(essentialEightAssessments.clientId, clientId),
                eq(essentialEightAssessments.controlId, controlId)
              )
            )
            .limit(1);
        } catch (e: any) {
          // If we still get a relation error, log it and rethrow, or retry one last time
          console.error("[EssentialEight] Error fetching existing assessment:", e);
          const msg = (e?.message || "").toLowerCase();
          if (msg.includes('relation') && msg.includes('essential_eight_assessments')) {
             console.log("[EssentialEight] Relation still missing after check, trying create one more time...");
             await ensureTables(dbConn);
             existing = await dbConn
              .select()
              .from(essentialEightAssessments)
              .where(
                and(
                  eq(essentialEightAssessments.clientId, clientId),
                  eq(essentialEightAssessments.controlId, controlId)
                )
              )
              .limit(1);
          } else {
            throw e;
          }
        }

        if (existing.length > 0) {
          await dbConn
            .update(essentialEightAssessments)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(essentialEightAssessments.id, existing[0].id));
          return { success: true, id: existing[0].id };
        } else {
          const [inserted] = await dbConn
            .insert(essentialEightAssessments)
            .values({
              clientId,
              controlId,
              maturityLevel: updates.maturityLevel ?? 0,
              targetLevel: updates.targetLevel ?? 1,
              assessmentAnswers: updates.assessmentAnswers ?? {},
              qualityCriteria: updates.qualityCriteria ?? {},
              levelNotes: updates.levelNotes ?? {},
              outcome: updates.outcome ?? "not_assessed",
              evidenceQuality: updates.evidenceQuality ?? "poor",
              evidenceQualityByLevel: updates.evidenceQualityByLevel ?? {},
              sampleCoverage: updates.sampleCoverage ?? {},
              compensatingControls: updates.compensatingControls ?? [],
              evidenceLinks: updates.evidenceLinks ?? [],
              notes: updates.notes ?? "",
            })
            .returning();
          return { success: true, id: inserted.id };
        }
      }),

    generateImprovementPlan: clientProcedure
      .input(
        z.object({
          clientId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }: { input: { clientId: number }; ctx: any }) => {
        const dbConn = await db.getDb();
        await ensureTables(dbConn);

        const scores = await dbConn
          .select()
          .from(essentialEightAssessments)
          .where(eq(essentialEightAssessments.clientId, input.clientId));

        if (!scores || scores.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "No Essential Eight assessment found. Please complete the assessment first.",
          });
        }

        const gaps = scores.filter((s: any) => {
          const hasGap = s.maturityLevel < s.targetLevel;
          const wasAssessed = s.maturityLevel !== null || s.targetLevel !== null;
          return hasGap && wasAssessed;
        });

        if (gaps.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "No improvement gaps found. All assessed controls are at or above target level.",
          });
        }

        const { implementationPlans, implementationTasks } = await import("../../schema");

        const [plan] = await dbConn
          .insert(implementationPlans)
          .values({
            clientId: input.clientId,
            title: "Essential Eight Improvement Plan",
            description: `Generated from Essential Eight assessment. ${gaps.length} ${gaps.length === 1 ? "control" : "controls"} identified for improvement out of ${scores.length} assessed.`,
            status: "planning",
            priority: "high",
            createdById: ctx.user?.id || 1,
          })
          .returning();

        const tasksToInsert = gaps.map((gap: any) => {
          const levelDiff = gap.targetLevel - gap.maturityLevel;
          const controlId = gap.controlId;

          return {
            implementationPlanId: plan.id,
            clientId: input.clientId,
            title: `${controlId}: Improve to Level ${gap.targetLevel}`,
            description: `Current Level: ${gap.maturityLevel} | Target: ${gap.targetLevel} | Gap: ${levelDiff} level(s)\n\n${gap.notes || "Review Essential Eight maturity criteria and implement necessary improvements."}`,
            status: "backlog",
            priority: levelDiff > 1 ? "high" : "medium",
            pdca: "Plan",
            tags: [controlId, "EssentialEight", `L${gap.targetLevel}`],
            createdById: ctx.user?.id || 1,
          };
        });

        await dbConn.insert(implementationTasks).values(tasksToInsert);

        return {
          success: true,
          planId: plan.id,
          taskCount: tasksToInsert.length,
          gaps: gaps.length,
          totalAssessed: scores.length,
        };
      }),
  });
};
