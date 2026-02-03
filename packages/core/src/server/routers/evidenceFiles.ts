
import { z } from "zod";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, desc, and, like } from "drizzle-orm";

export const createEvidenceFilesRouter = (
    t: any,
    adminProcedure: any,
    publicProcedure: any
) => {
    return t.router({
        list: publicProcedure
            .input(z.object({
                evidenceId: z.number()
            }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                return dbConn.select().from(schema.evidenceFiles)
                    .where(eq(schema.evidenceFiles.evidenceId, input.evidenceId))
                    .orderBy(desc(schema.evidenceFiles.createdAt));
            }),

        create: adminProcedure
            .input(z.object({
                evidenceId: z.number(),
                filename: z.string(),
                fileKey: z.string(),
                url: z.string(),
                originalFilename: z.string().optional(),
                mimeType: z.string().optional(),
                size: z.number().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const dbConn = await getDb();
                const [file] = await dbConn.insert(schema.evidenceFiles).values({
                    evidenceId: input.evidenceId,
                    filename: input.originalFilename || input.filename,
                    fileKey: input.fileKey,
                    fileUrl: input.url,
                    contentType: input.mimeType,
                    fileSize: input.size,
                    uploadedBy: ctx.user?.id,
                }).returning();
                return file;
            }),

        // List all files for a client (for library picker)
        listAll: publicProcedure
            .input(z.object({
                clientId: z.number(),
                search: z.string().optional()
            }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                // We need to join with evidence table to filter by client
                // Assuming simple join is supported or filter manually if easier, 
                // but SQL join is better.
                // Since Drizzle syntax for unrelated tables in `db.select().from()` is a bit specific if relations aren't defined,
                // I'll try to use explicit join if possible, or raw sql if needed.
                // Checking previous files, they use `dbConn.select().from(...)`.

                // Let's assume we can fetch all files and filter (not efficient but safe for v1) or join.
                // Better: Select from evidenceFiles inner join evidence on evidenceId

                const files = await dbConn.selectDistinctOn([schema.evidenceFiles.fileKey], {
                    id: schema.evidenceFiles.id,
                    filename: schema.evidenceFiles.filename,
                    fileUrl: schema.evidenceFiles.fileUrl,
                    fileKey: schema.evidenceFiles.fileKey,
                    contentType: schema.evidenceFiles.contentType,
                    fileSize: schema.evidenceFiles.fileSize,
                    createdAt: schema.evidenceFiles.createdAt,
                    evidenceTitle: schema.evidence.description // Get context
                })
                    .from(schema.evidenceFiles)
                    .innerJoin(schema.evidence, eq(schema.evidenceFiles.evidenceId, schema.evidence.id))
                    .where(and(
                        eq(schema.evidence.clientId, input.clientId),
                        input.search ? like(schema.evidenceFiles.filename, `%${input.search}%`) : undefined
                    ))
                    .orderBy(schema.evidenceFiles.fileKey, desc(schema.evidenceFiles.createdAt))
                    .limit(50); // Limit to 50 recent files for performance

                return files;
            }),

        linkExisting: adminProcedure
            .input(z.object({
                targetEvidenceId: z.number(),
                sourceFileId: z.number()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const dbConn = await getDb();

                // 1. Get source file
                const [sourceFile] = await dbConn.select()
                    .from(schema.evidenceFiles)
                    .where(eq(schema.evidenceFiles.id, input.sourceFileId));

                if (!sourceFile) {
                    throw new Error("Source file not found");
                }

                // 2. Check if already linked
                // We assume fileKey is unique per file content.
                const existingLinks = await dbConn.select()
                    .from(schema.evidenceFiles)
                    .where(and(
                        eq(schema.evidenceFiles.evidenceId, input.targetEvidenceId),
                        eq(schema.evidenceFiles.fileKey, sourceFile.fileKey)
                    ));

                if (existingLinks.length > 0) {
                    throw new Error("This file is already attached to this request.");
                }

                // 3. Create copy linked to new evidence
                const [newFile] = await dbConn.insert(schema.evidenceFiles).values({
                    evidenceId: input.targetEvidenceId,
                    filename: sourceFile.filename,
                    fileKey: sourceFile.fileKey,
                    fileUrl: sourceFile.fileUrl,
                    contentType: sourceFile.contentType,
                    fileSize: sourceFile.fileSize,
                    uploadedBy: ctx.user?.id,
                }).returning();

                return newFile;
            }),

        delete: publicProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                await dbConn.delete(schema.evidenceFiles)
                    .where(eq(schema.evidenceFiles.id, input.id));
                return { success: true };
            }),
    });
};
