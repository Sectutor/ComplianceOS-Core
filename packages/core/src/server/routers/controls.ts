
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { controls } from "../../schema";
import * as schema from "../../schema";
import * as db from "../../db";
import { eq, ilike, and, desc, sql, or } from "drizzle-orm";
import { createExpressMiddleware } from '@trpc/server/adapters/express';

// Helper for history
const logControlHistory = async (dbConn: any, controlId: number, userId: number, changeNote: string, version: number) => {
    try {
        // Placeholder
    } catch (e) {
        console.error("Failed to log history", e);
    }
};


export const createControlsRouter = (t: any, adminProcedure: any, publicProcedure: any) => {
    return t.router({
        list: publicProcedure
        .input(z.object({ framework: z.string().optional(), clientId: z.number().optional() }).optional())
        .query(async ({ input }: any) => {
            console.log("[ControlsRouter] list called", input);
            try {
                // If requesting NIST SP 800-171 Rev 2, map to NIST SP 800-53 Rev 5 and filter
                // Or just return all controls if "NIST SP 800-171 Rev 2" doesn't exist in DB as a distinct framework
                // Currently our seed might not have "NIST SP 800-171 Rev 2" explicitly if it's using 800-53
                
                const framework = input?.framework;
                if (framework === "NIST SP 800-171 Rev 2") {
                    // Fallback to fetch all or fetch 800-53 and filter in UI? 
                    // Better: If DB has 171, use it. If not, try 800-53.
                    // For now, let's pass it through. If DB returns empty, we might need to seed it or alias it.
                    
                    // CHECK: Do we have "NIST SP 800-171 Rev 2" in the controls table?
                    // If not, we should probably return "NIST SP 800-53 Rev 5" controls that map to 171?
                    // Or just let the UI handle the mapping if we return nothing.
                    
                    // Temporary Hack: If 171 requested and returns 0, try returning 800-53
                    const results = await db.getControls(framework, input?.clientId);
                    if (results.length === 0) {
                        console.log("No 800-171 controls found, trying NIST SP 800-53 Rev 5");
                        return await db.getControls("NIST SP 800-53 Rev 5", input?.clientId);
                    }
                    return results;
                }

                return await db.getControls(framework, input?.clientId);
            } catch (e) {
                console.error("[ControlsRouter] list error:", e);
                throw e;
            }
        }),

        listPaginated: publicProcedure
            .input(z.object({
                framework: z.union([z.string(), z.array(z.string())]).optional(),
                clientId: z.number().optional(),
                limit: z.number().optional().default(50),
                offset: z.number().optional().default(0),
                search: z.string().optional()
            }).optional())
            .query(async ({ input }: any) => {
                console.log("[ControlsRouter] listPaginated called", input);
                try {
                    const result = await db.getControlsPaginated(
                        input?.framework,
                        input?.clientId,
                        input?.limit,
                        input?.offset,
                        input?.search
                    );
                    console.log("[ControlsRouter] listPaginated count:", result.total);
                    return result;
                } catch (e) {
                    console.error("[ControlsRouter] listPaginated error:", e);
                    throw e;
                }
            }),

        getAvailableFrameworks: publicProcedure
            .input(z.object({ clientId: z.number().optional() }).optional())
            .query(async ({ input }: any) => {
                console.log("[ControlsRouter] getAvailableFrameworks called", input);
                try {
                    const dbConn = await db.getDb();
                    const standard = await dbConn.selectDistinct({ framework: schema.controls.framework }).from(schema.controls);
                    const list = standard.map((c: any) => c.framework).filter(Boolean) as string[];

                    if (input?.clientId) {
                        const clientFws = await dbConn.select().from(schema.clientFrameworks).where(eq(schema.clientFrameworks.clientId, input.clientId));
                        clientFws.forEach((f: any) => list.push(f.name));
                    } else {
                        const allClientFws = await dbConn.selectDistinct({ name: schema.clientFrameworks.name }).from(schema.clientFrameworks);
                        allClientFws.forEach((f: any) => list.push(f.name));
                    }

                    return Array.from(new Set(list)).sort();
                } catch (e) {
                    console.error("[ControlsRouter] getAvailableFrameworks error:", e);
                    throw e;
                }
            }),

        get: publicProcedure
            .input(z.object({ id: z.number() }))
            .query(async ({ input }: any) => {
                const control = await db.getControlById(input.id);
                if (!control) throw new TRPCError({ code: "NOT_FOUND" });
                return control;
            }),

        create: adminProcedure
            .input(z.object({
                controlId: z.string(),
                name: z.string(),
                description: z.string().optional(),
                framework: z.string(),
                owner: z.string().optional(),
                status: z.enum(["active", "inactive", "draft"]).optional(),
            }))
            .mutation(async ({ input }: any) => {
                return await db.createControl(input);
            }),

        update: adminProcedure
            .input(z.object({
                id: z.number(),
                controlId: z.string(),
                name: z.string(),
                description: z.string().optional(),
                framework: z.string(),
                owner: z.string().optional(),
                status: z.enum(["active", "inactive", "draft"]).optional(),
                implementationGuidance: z.string().optional(),
                changeNote: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const { id, changeNote, ...data } = input;
                await db.updateControl(id, data, 0, changeNote);
                return { success: true };
            }),

        delete: adminProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input }: any) => {
                await db.deleteControl(input.id);
                return { success: true };
            }),

        history: publicProcedure
            .input(z.object({ controlId: z.number() }))
            .query(async ({ input }: any) => {
                return await db.getControlHistory(input.controlId);
            }),

        generateGuidance: adminProcedure
            .input(z.object({
                controlId: z.number(),
                framework: z.string()
            }))
            .mutation(async ({ input }: any) => {
                const control = await db.getControlById(input.controlId);
                if (!control) {
                    throw new TRPCError({ code: "NOT_FOUND", message: "Control not found" });
                }

                const prompt = `
You are a senior compliance expert specializing in ${input.framework}.
Provide clear, actionable, and practical implementation guidance for the following control:

Control ID: ${control.controlId}
Control Name: ${control.name}
Description: ${control.description || "N/A"}

Your response should be:
1. Practical: specific steps an organization needs to take.
2. Concise: Use bullet points where possible.
3. Focused: Strictly related to meeting the requirements of this specific control.
4. Do not include introductory filler ("Here is the guidance..."). Just give the guidance.
`;

                const completion = await import("../../lib/llm/service").then(m => m.llmService.generate({
                    userPrompt: prompt,
                    feature: "control_guidance",
                    temperature: 0.3
                }));

                const guidance = completion.text;

                // Update the control
                await db.updateControl(input.controlId, { implementationGuidance: guidance }, 0, "AI Generated Guidance");

                return { text: guidance };
            })
    });
};
