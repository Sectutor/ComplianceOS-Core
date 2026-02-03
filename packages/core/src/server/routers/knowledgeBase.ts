
import { z } from "zod";
import { router, clientProcedure } from "../../routers";
import * as schema from "../../schema";
import { eq, desc, and, ilike, or } from "drizzle-orm";
import * as db from "../../db";

export const createKnowledgeBaseRouter = (t: any, clientProcedure: any) =>
  router({
    list: clientProcedure
      .input(
        z.object({
          clientId: z.number(),
          search: z.string().optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }: any) => {
        const dbConn = await db.getDb();
        const filters = [eq(schema.knowledgeBaseEntries.clientId, input.clientId)];

        if (input.search) {
          filters.push(
            or(
              ilike(schema.knowledgeBaseEntries.question, `%${input.search}%`),
              ilike(schema.knowledgeBaseEntries.answer, `%${input.search}%`)
            )
          );
        }

        const entries = await dbConn
          .select()
          .from(schema.knowledgeBaseEntries)
          .where(and(...filters))
          .orderBy(desc(schema.knowledgeBaseEntries.updatedAt))
          .limit(input.limit)
          .offset(input.offset);

        return entries;
      }),

    create: clientProcedure
      .input(
        z.object({
          clientId: z.number(),
          question: z.string(),
          answer: z.string(),
          tags: z.array(z.string()).optional(),
          access: z.enum(["internal", "public", "restricted"]).optional(),
          assigneeId: z.number().optional(),
          comments: z.string().optional(),
        })
      )
      .mutation(async ({ input }: any) => {
        const dbConn = await db.getDb();
        const [entry] = await dbConn
          .insert(schema.knowledgeBaseEntries)
          .values({
            ...input,
            health: "good",
          })
          .returning();
        return entry;
      }),

    update: clientProcedure
      .input(
        z.object({
          id: z.number(),
          question: z.string().optional(),
          answer: z.string().optional(),
          tags: z.array(z.string()).optional(),
          access: z.enum(["internal", "public", "restricted"]).optional(),
          assigneeId: z.number().optional(),
          health: z.string().optional(),
          comments: z.string().optional(),
        })
      )
      .mutation(async ({ input }: any) => {
        const dbConn = await db.getDb();
        const { id, ...updates } = input;
        
        await dbConn
          .update(schema.knowledgeBaseEntries)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(schema.knowledgeBaseEntries.id, id));
          
        return { success: true };
      }),

    delete: clientProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }: any) => {
        const dbConn = await db.getDb();
        await dbConn
          .delete(schema.knowledgeBaseEntries)
          .where(eq(schema.knowledgeBaseEntries.id, input.id));
        return { success: true };
      }),
  });
