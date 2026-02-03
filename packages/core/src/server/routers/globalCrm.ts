import { z } from "zod";
import * as db from "../../db";
import { globalContacts, globalCrmActivities, globalCrmNotes, globalCrmDeals, globalCrmTags, globalCrmContactTags } from "../../schema";
import { eq, desc, inArray, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const createGlobalCrmRouter = (t: any, adminProcedure: any) => {
    return t.router({
        // List all global contacts (admin only)
        list: adminProcedure
            .query(async () => {
                const d = await db.getDb();
                const contacts = await d.select().from(globalContacts).orderBy(desc(globalContacts.createdAt));

                // Fetch tags for all contacts
                const contactTags = await d.select({
                    contactId: globalCrmContactTags.contactId,
                    tag: {
                        id: globalCrmTags.id,
                        name: globalCrmTags.name,
                        color: globalCrmTags.color
                    }
                })
                    .from(globalCrmContactTags)
                    .innerJoin(globalCrmTags, eq(globalCrmContactTags.tagId, globalCrmTags.id));

                return contacts.map((c: any) => ({
                    ...c,
                    tags: contactTags.filter((ct: any) => ct.contactId === c.id).map((ct: any) => ct.tag)
                }));
            }),

        // Get a single contact by ID with activities, notes, deals, and tags
        get: adminProcedure
            .input(z.object({ id: z.number() }))
            .query(async ({ input }: any) => {
                const d = await db.getDb();
                const result = await d.select().from(globalContacts).where(eq(globalContacts.id, input.id));
                if (result.length === 0) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' });
                }

                // Fetch activities, notes, deals, and tags
                const activities = await d.select().from(globalCrmActivities)
                    .where(eq(globalCrmActivities.contactId, input.id))
                    .orderBy(desc(globalCrmActivities.createdAt));

                const notes = await d.select().from(globalCrmNotes)
                    .where(eq(globalCrmNotes.contactId, input.id))
                    .orderBy(desc(globalCrmNotes.createdAt));

                const deals = await d.select().from(globalCrmDeals)
                    .where(eq(globalCrmDeals.contactId, input.id))
                    .orderBy(desc(globalCrmDeals.createdAt));

                const tags = await d.select({
                    id: globalCrmTags.id,
                    name: globalCrmTags.name,
                    color: globalCrmTags.color
                })
                    .from(globalCrmContactTags)
                    .innerJoin(globalCrmTags, eq(globalCrmContactTags.tagId, globalCrmTags.id))
                    .where(eq(globalCrmContactTags.contactId, input.id));

                return { ...result[0], activities, notes, deals, tags };
            }),

        // Create a new global contact
        create: adminProcedure
            .input(z.object({
                firstName: z.string().optional(),
                lastName: z.string().optional(),
                email: z.string().email(),
                company: z.string().optional(),
                role: z.string().optional(),
                phone: z.string().optional(),
                source: z.string().optional().default("manual"),
                status: z.string().optional().default("lead"),
                notes: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const d = await db.getDb();

                // Check for duplicate email
                const existing = await d.select().from(globalContacts).where(eq(globalContacts.email, input.email));
                if (existing.length > 0) {
                    throw new TRPCError({ code: 'CONFLICT', message: 'A contact with this email already exists' });
                }

                const result = await d.insert(globalContacts).values({
                    firstName: input.firstName,
                    lastName: input.lastName,
                    email: input.email,
                    company: input.company,
                    role: input.role,
                    phone: input.phone,
                    source: input.source,
                    status: input.status,
                    notes: input.notes,
                    createdBy: ctx.user?.id,
                }).returning();

                return result[0];
            }),

        // Update a global contact
        update: adminProcedure
            .input(z.object({
                id: z.number(),
                firstName: z.string().optional(),
                lastName: z.string().optional(),
                email: z.string().email().optional(),
                company: z.string().optional(),
                role: z.string().optional(),
                phone: z.string().optional(),
                status: z.string().optional(),
                notes: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const d = await db.getDb();
                const { id, ...rawUpdates } = input;

                // Filter out undefined values
                const updates: Record<string, any> = {};
                for (const [key, value] of Object.entries(rawUpdates)) {
                    if (value !== undefined) {
                        updates[key] = value;
                    }
                }

                const result = await d.update(globalContacts)
                    .set({ ...updates, updatedAt: new Date() })
                    .where(eq(globalContacts.id, id))
                    .returning();

                if (result.length === 0) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' });
                }

                return result[0];
            }),

        // Delete a global contact
        remove: adminProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input }: any) => {
                const d = await db.getDb();
                console.log('[CRM] Deleting contact:', input.id);

                // Delete related records first
                await d.delete(globalCrmActivities).where(eq(globalCrmActivities.contactId, input.id));
                await d.delete(globalCrmNotes).where(eq(globalCrmNotes.contactId, input.id));
                await d.delete(globalCrmDeals).where(eq(globalCrmDeals.contactId, input.id));
                await d.delete(globalCrmContactTags).where(eq(globalCrmContactTags.contactId, input.id));

                const result = await d.delete(globalContacts).where(eq(globalContacts.id, input.id)).returning();

                if (result.length === 0) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' });
                }

                return { success: true };
            }),

        // Bulk update contact status
        bulkUpdateStatus: adminProcedure
            .input(z.object({
                ids: z.array(z.number()),
                status: z.string()
            }))
            .mutation(async ({ input }: any) => {
                const d = await db.getDb();
                await d.update(globalContacts)
                    .set({ status: input.status, updatedAt: new Date() })
                    .where(inArray(globalContacts.id, input.ids));
                return { success: true };
            }),

        // Bulk delete contacts
        bulkDelete: adminProcedure
            .input(z.object({ ids: z.array(z.number()) }))
            .mutation(async ({ input }: any) => {
                const d = await db.getDb();

                // Delete related records first
                await d.delete(globalCrmActivities).where(inArray(globalCrmActivities.contactId, input.ids));
                await d.delete(globalCrmNotes).where(inArray(globalCrmNotes.contactId, input.ids));
                await d.delete(globalCrmDeals).where(inArray(globalCrmDeals.contactId, input.ids));
                await d.delete(globalCrmContactTags).where(inArray(globalCrmContactTags.contactId, input.ids));

                await d.delete(globalContacts).where(inArray(globalContacts.id, input.ids));
                return { success: true };
            }),

        // Convert a waitlist lead to a global contact
        convertFromWaitlist: adminProcedure
            .input(z.object({
                firstName: z.string().optional(),
                lastName: z.string().optional(),
                email: z.string().email(),
                company: z.string().optional(),
                role: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const d = await db.getDb();

                // Check for duplicate email
                const existing = await d.select().from(globalContacts).where(eq(globalContacts.email, input.email));
                if (existing.length > 0) {
                    // Already exists, just return it
                    return { ...existing[0], alreadyExisted: true };
                }

                const result = await d.insert(globalContacts).values({
                    firstName: input.firstName,
                    lastName: input.lastName,
                    email: input.email,
                    company: input.company,
                    role: input.role,
                    source: 'waitlist',
                    status: 'lead',
                    createdBy: ctx.user?.id,
                }).returning();

                return { ...result[0], alreadyExisted: false };
            }),

        // ===== ACTIVITIES =====

        // Add an activity to a contact
        addActivity: adminProcedure
            .input(z.object({
                contactId: z.number(),
                type: z.enum(['call', 'email', 'meeting', 'task', 'other']),
                subject: z.string().optional(),
                description: z.string().optional(),
                outcome: z.string().optional(),
                scheduledAt: z.string().optional(), // ISO date string
                completedAt: z.string().optional(),
                duration: z.number().optional(), // in minutes
            }))
            .mutation(async ({ input, ctx }: any) => {
                const d = await db.getDb();

                const result = await d.insert(globalCrmActivities).values({
                    contactId: input.contactId,
                    type: input.type,
                    subject: input.subject,
                    description: input.description,
                    outcome: input.outcome,
                    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
                    completedAt: input.completedAt ? new Date(input.completedAt) : null,
                    duration: input.duration,
                    createdBy: ctx.user?.id,
                }).returning();

                return result[0];
            }),

        // List activities for a contact
        listActivities: adminProcedure
            .input(z.object({ contactId: z.number() }))
            .query(async ({ input }: any) => {
                const d = await db.getDb();
                return d.select().from(globalCrmActivities)
                    .where(eq(globalCrmActivities.contactId, input.contactId))
                    .orderBy(desc(globalCrmActivities.createdAt));
            }),

        // ===== NOTES =====

        // Add a note to a contact
        addNote: adminProcedure
            .input(z.object({
                contactId: z.number(),
                content: z.string(),
                isPinned: z.boolean().optional().default(false),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const d = await db.getDb();

                const result = await d.insert(globalCrmNotes).values({
                    contactId: input.contactId,
                    content: input.content,
                    isPinned: input.isPinned,
                    createdBy: ctx.user?.id,
                }).returning();

                return result[0];
            }),

        // List notes for a contact
        listNotes: adminProcedure
            .input(z.object({ contactId: z.number() }))
            .query(async ({ input }: any) => {
                const d = await db.getDb();
                return d.select().from(globalCrmNotes)
                    .where(eq(globalCrmNotes.contactId, input.contactId))
                    .orderBy(desc(globalCrmNotes.createdAt));
            }),

        // Update a note
        updateNote: adminProcedure
            .input(z.object({
                id: z.number(),
                content: z.string().optional(),
                isPinned: z.boolean().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const d = await db.getDb();
                const { id, ...updates } = input;

                const result = await d.update(globalCrmNotes)
                    .set({ ...updates, updatedAt: new Date() })
                    .where(eq(globalCrmNotes.id, id))
                    .returning();

                return result[0];
            }),

        // Delete a note
        deleteNote: adminProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input }: any) => {
                const d = await db.getDb();
                await d.delete(globalCrmNotes).where(eq(globalCrmNotes.id, input.id));
                return { success: true };
            }),

        // Complete an activity
        completeActivity: adminProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input }: any) => {
                const d = await db.getDb();
                await d.update(globalCrmActivities)
                    .set({ completedAt: new Date() })
                    .where(eq(globalCrmActivities.id, input.id));
                return { success: true };
            }),

        // Delete an activity
        deleteActivity: adminProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input }: any) => {
                const d = await db.getDb();
                console.log('[CRM] Deleting activity:', input.id);
                await d.delete(globalCrmActivities).where(eq(globalCrmActivities.id, input.id));
                return { success: true };
            }),

        // ===== DEALS =====

        addDeal: adminProcedure
            .input(z.object({
                contactId: z.number(),
                name: z.string(),
                value: z.number(), // in cents
                probability: z.number().min(0).max(100).optional().default(0),
                stage: z.enum(['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
                expectedCloseDate: z.string().optional(),
                description: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const d = await db.getDb();
                const result = await d.insert(globalCrmDeals).values({
                    ...input,
                    expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
                    createdBy: ctx.user?.id,
                }).returning();
                return result[0];
            }),

        updateDeal: adminProcedure
            .input(z.object({
                id: z.number(),
                name: z.string().optional(),
                value: z.number().optional(),
                probability: z.number().min(0).max(100).optional(),
                stage: z.enum(['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
                expectedCloseDate: z.string().optional(),
                description: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const d = await db.getDb();
                const { id, ...updates } = input;
                const result = await d.update(globalCrmDeals)
                    .set({
                        ...updates,
                        expectedCloseDate: updates.expectedCloseDate ? new Date(updates.expectedCloseDate) : undefined,
                        updatedAt: new Date()
                    } as any)
                    .where(eq(globalCrmDeals.id, id))
                    .returning();
                return result[0];
            }),

        deleteDeal: adminProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input }: any) => {
                const d = await db.getDb();
                await d.delete(globalCrmDeals).where(eq(globalCrmDeals.id, input.id));
                return { success: true };
            }),

        // ===== TAGS =====

        listAllTags: adminProcedure
            .query(async () => {
                const d = await db.getDb();
                return d.select().from(globalCrmTags).orderBy(globalCrmTags.name);
            }),

        createTag: adminProcedure
            .input(z.object({
                name: z.string(),
                color: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const d = await db.getDb();
                const result = await d.insert(globalCrmTags).values(input).returning();
                return result[0];
            }),

        addTagToContact: adminProcedure
            .input(z.object({
                contactId: z.number(),
                tagId: z.number(),
            }))
            .mutation(async ({ input }: any) => {
                const d = await db.getDb();
                // Check if exists
                const existing = await d.select().from(globalCrmContactTags)
                    .where(and(eq(globalCrmContactTags.contactId, input.contactId), eq(globalCrmContactTags.tagId, input.tagId)));
                if (existing.length > 0) return { success: true };

                await d.insert(globalCrmContactTags).values(input);
                return { success: true };
            }),

        removeTagFromContact: adminProcedure
            .input(z.object({
                contactId: z.number(),
                tagId: z.number(),
            }))
            .mutation(async ({ input }: any) => {
                const d = await db.getDb();
                await d.delete(globalCrmContactTags)
                    .where(and(eq(globalCrmContactTags.contactId, input.contactId), eq(globalCrmContactTags.tagId, input.tagId)));
                return { success: true };
            }),

        // ===== CSV IMPORT =====

        // Import contacts from CSV data
        importCsv: adminProcedure
            .input(z.object({
                contacts: z.array(z.object({
                    firstName: z.string().optional(),
                    lastName: z.string().optional(),
                    email: z.string().email(),
                    company: z.string().optional(),
                    role: z.string().optional(),
                    phone: z.string().optional(),
                    status: z.string().optional(),
                })),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const d = await db.getDb();
                let imported = 0;
                let skipped = 0;
                const errors: string[] = [];

                for (const contact of input.contacts) {
                    try {
                        // Check for duplicate email
                        const existing = await d.select().from(globalContacts)
                            .where(eq(globalContacts.email, contact.email));

                        if (existing.length > 0) {
                            skipped++;
                            continue;
                        }

                        await d.insert(globalContacts).values({
                            firstName: contact.firstName,
                            lastName: contact.lastName,
                            email: contact.email,
                            company: contact.company,
                            role: contact.role,
                            phone: contact.phone,
                            source: 'import',
                            status: contact.status || 'lead',
                            createdBy: ctx.user?.id,
                        });
                        imported++;
                    } catch (e: any) {
                        errors.push(`${contact.email}: ${e.message}`);
                    }
                }

                return { imported, skipped, errors };
            }),
    });
};
