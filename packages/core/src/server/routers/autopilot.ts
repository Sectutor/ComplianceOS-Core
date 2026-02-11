
// import { AutopilotService } from "../../lib/advisor/autopilot";
import { getDb } from "../../db";
import { auditLogs } from "../../schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

export const createAutopilotRouter = (t: any, procedure: any) => {
    return t.router({
        trigger: procedure
            .input(z.object({ clientId: z.number() }))
            .mutation(async ({ ctx, input }: any) => {
                throw new Error("Autopilot is a Premium feature. Please upgrade to use this check.");
            }),

        getLastRun: procedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ ctx, input }: any) => {
                const clientId = input.clientId;
                const db = await getDb();

                const lastRun = await db.query.auditLogs.findFirst({
                    where: and(
                        eq(auditLogs.clientId, clientId),
                        eq(auditLogs.action, 'autopilot_run')
                    ),
                    orderBy: [desc(auditLogs.createdAt)]
                });

                return lastRun || null; // Return null instead of undefined
            })
    });
};
