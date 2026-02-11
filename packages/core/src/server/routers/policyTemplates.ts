
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as schema from "../../schema";
import { policyTemplates, clientPolicies } from "../../schema";
import { getDb } from "../../db";
import { eq, desc, or, and, sql } from "drizzle-orm";

export const createPolicyTemplatesRouter = (t: any, publicProcedure: any, isAuthed: any) => {
    return t.router({
        list: publicProcedure
            .use(isAuthed)
            .input(z.object({
                framework: z.string().optional(),
                clientId: z.number().optional()
            }).optional())
            .query(async ({ input, ctx }: any) => {
                const db = await getDb();

                const baseConditions = [
                    or(
                        eq(policyTemplates.isPublic, true),
                        eq(policyTemplates.ownerId, ctx.user.id),
                        input?.clientId ? eq(policyTemplates.clientId, input.clientId) : undefined
                    )
                ].filter(Boolean);

                const whereClause = and(...baseConditions as any);

                // If framework filter is provided and not 'all', filter by framework
                // frameworks is a JSON array, so we check if it contains the framework
                if (input?.framework && input.framework !== 'all') {
                    return await db.select().from(policyTemplates)
                        .where(and(
                            whereClause,
                            sql`${policyTemplates.frameworks}::jsonb @> ${JSON.stringify([input.framework])}::jsonb`
                        ));
                }

                return await db.select().from(policyTemplates)
                    .where(whereClause);
            }),

        get: publicProcedure
            .use(isAuthed)
            .input(z.object({ templateId: z.string() }))
            .query(async ({ input, ctx }: any) => {
                const db = await getDb();
                const [template] = await db.select().from(policyTemplates)
                    .where(eq(policyTemplates.templateId, input.templateId));

                if (!template) {
                    throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
                }

                // Privacy check
                if (!template.isPublic && template.ownerId !== ctx.user.id && ctx.user.role !== 'admin') {
                    // Also check if clientId matches if user has access to that client
                    if (template.clientId) {
                        const [membership] = await db.select().from(schema.userClients)
                            .where(and(eq(schema.userClients.userId, ctx.user.id), eq(schema.userClients.clientId, template.clientId)));

                        if (!membership && ctx.user.role !== 'admin') {
                            throw new TRPCError({ code: "FORBIDDEN", message: "Private template" });
                        }
                    } else {
                        throw new TRPCError({ code: "FORBIDDEN", message: "Private template" });
                    }
                }

                return template;
            }),

        create: publicProcedure
            .use(isAuthed)
            .input(z.object({
                name: z.string(),
                content: z.string().optional(),
                sections: z.any().optional(),
                isPublic: z.boolean().default(false),
                clientId: z.number().optional()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                const templateId = `tpl_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

                const [template] = await db.insert(policyTemplates).values({
                    templateId,
                    name: input.name,
                    content: input.content || "",
                    sections: input.sections,
                    ownerId: ctx.user.id,
                    isPublic: input.isPublic,
                    clientId: input.clientId
                }).returning();

                return template;
            }),

        update: publicProcedure
            .use(isAuthed)
            .input(z.object({
                id: z.number(),
                name: z.string().optional(),
                content: z.string().optional(),
                isPublic: z.boolean().optional(),
                sections: z.any().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();

                const [existing] = await db.select().from(policyTemplates).where(eq(policyTemplates.id, input.id));

                if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

                if (existing.ownerId !== ctx.user.id && ctx.user.role !== 'admin') {
                    throw new TRPCError({ code: "FORBIDDEN", message: "Not your template" });
                }

                const { id, ...data } = input;
                const [updated] = await db.update(policyTemplates)
                    .set(data)
                    .where(eq(policyTemplates.id, id))
                    .returning();

                return updated;
            }),

        delete: publicProcedure
            .use(isAuthed)
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                const [existing] = await db.select().from(policyTemplates).where(eq(policyTemplates.id, input.id));

                if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

                if (existing.ownerId !== ctx.user.id && ctx.user.role !== 'admin') {
                    throw new TRPCError({ code: "FORBIDDEN", message: "Not your template" });
                }

                await db.delete(policyTemplates).where(eq(policyTemplates.id, input.id));
                return { success: true };
            }),

        deploy: publicProcedure
            .use(isAuthed)
            .input(z.object({
                templateId: z.string(),
                clientIds: z.array(z.number())
            }))
            .mutation(async ({ input, ctx }: any) => {
                const dbConn = await getDb();

                // Get Template
                const [template] = await dbConn.select().from(policyTemplates)
                    .where(eq(policyTemplates.templateId, input.templateId));

                if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });

                // Check Access
                if (!template.isPublic && template.ownerId !== ctx.user.id && ctx.user.role !== 'admin') {
                    throw new TRPCError({ code: "FORBIDDEN", message: "No access to template" });
                }

                const results = [];
                for (const clientId of input.clientIds) {
                    // Check client access
                    const membership = await dbConn.select().from(schema.userClients)
                        .where(and(eq(schema.userClients.userId, ctx.user.id), eq(schema.userClients.clientId, clientId)));

                    if (membership.length === 0 && ctx.user.role !== 'admin') continue;

                    // Create policy from template
                    const [policy] = await dbConn.insert(schema.clientPolicies).values({
                        clientId,
                        name: template.name,
                        content: template.content,
                        status: 'draft',
                        version: '1.0',
                        createdById: ctx.user.id,
                        policyType: 'custom'
                    }).returning();
                    results.push({ clientId, policyId: policy.id });
                }

                return { success: true, deployedTo: results.length, details: results };
            }),

        preview: publicProcedure
            .use(isAuthed)
            .input(z.object({
                clientId: z.number(),
                templateId: z.number().optional(),
                sections: z.array(z.string()).optional(),
                tailor: z.boolean().optional(),
                instruction: z.string().optional()
            }))
            .mutation(async ({ input }: any) => {
                const { policyGenerator } = await import("../../lib/policy/policy-generation");

                let content = "";
                if (input.templateId) {
                    content = await policyGenerator.generate(input.clientId, input.templateId, {
                        tailorToIndustry: input.tailor,
                        customInstruction: input.instruction
                    });
                } else if (input.sections && input.sections.length > 0) {
                    content = await policyGenerator.generateFromSections(input.clientId, "New Policy", input.sections, {
                        tailorToIndustry: input.tailor,
                        customInstruction: input.instruction
                    });
                }

                return { content };
            }),

        upgradeAll: publicProcedure
            .use(isAuthed)
            .input(z.object({
                dryRun: z.boolean().default(true)
            }).optional())
            .mutation(async ({ input, ctx }: any) => {
                if (ctx.user.role !== 'admin' && ctx.user.role !== 'owner' && ctx.user.role !== 'super_admin') {
                    throw new TRPCError({ code: "FORBIDDEN", message: "Admin or Owner required" });
                }
                const db = await getDb();
                const templates = await db.select().from(policyTemplates).orderBy(desc(policyTemplates.createdAt));

                const sanitize = (html: string, title: string) => {
                    let s = html || "";
                    // Strip fenced code blocks
                    s = s.replace(/```html([\s\S]*?)```/gi, "$1").replace(/```([\s\S]*?)```/gi, "$1");
                    // Extract <pre><code>...</code></pre>
                    s = s.replace(/<pre[\s\S]*?>[\s\S]*?<code[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/gi, "$1");
                    // Decode entities
                    s = s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
                    // Remove accidental [object Object] artifacts
                    s = s.replace(/\[object Object\]/g, "");
                    // Remove outer wrappers
                    const bodyMatch = s.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                    if (bodyMatch) s = bodyMatch[1];
                    // Drop style/script tags
                    s = s.replace(/<\/?(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
                    // Replace <section> with <div>
                    s = s.replace(/<section([^>]*)>/gi, "<div$1>").replace(/<\/section>/gi, "</div>");
                    // Ensure H1 title at top
                    try {
                        const container = globalThis.document ? document.createElement("div") : null;
                        if (container) {
                            container.innerHTML = s || "";
                            let h1 = container.querySelector("h1");
                            const t = (title || "Information Security Policy").trim();
                            if (!h1) {
                                h1 = document.createElement("h1");
                                h1.textContent = t;
                                container.insertBefore(h1, container.firstChild);
                            } else if (t && (h1.textContent || "").trim() !== t) {
                                h1.textContent = t;
                            }
                            s = container.innerHTML;
                        } else {
                            // Server-side fallback: prepend title if missing
                            if (!/\<h1[\s\S]*?\>/.test(s)) {
                                s = `<h1>${title || "Information Security Policy"}</h1>\n${s}`;
                            }
                        }
                    } catch {
                        if (!/\<h1[\s\S]*?\>/.test(s)) {
                            s = `<h1>${title || "Information Security Policy"}</h1>\n${s}`;
                        }
                    }
                    return s.trim();
                };

                const defaultSectionTitles = [
                    "Purpose",
                    "Scope",
                    "Roles and Responsibilities",
                    "Policy Statements",
                    "Procedures",
                    "Exceptions",
                    "Enforcement",
                    "Definitions",
                    "References",
                    "Revision History"
                ];

                const buildSkeleton = (title: string, sectionTitles?: string[]) => {
                    const t = (title || "Information Security Policy").trim();
                    const secs = (sectionTitles && sectionTitles.length > 0 ? sectionTitles : defaultSectionTitles);
                    const parts = secs.map(st => `<h2>${st}</h2>\n<p>[Content]</p>`);
                    return [`<h1>${t}</h1>`, ...parts].join("\n\n");
                };

                const results: Array<{ id: number; updated: boolean; changes: string[] }> = [];
                for (const tpl of templates) {
                    const changes: string[] = [];
                    let content = tpl.content || "";
                    const before = content;
                    const title = tpl.name || "Information Security Policy";
                    // If content empty, build skeleton using template sections or defaults
                    if (!content || content.trim().length === 0) {
                        const sectionTitles = Array.isArray(tpl.sections)
                            ? (tpl.sections as any[]).map(s => (typeof s === 'object' ? (s.title || 'Section') : String(s))).filter(Boolean)
                            : undefined;
                        content = buildSkeleton(title, sectionTitles);
                        changes.push("skeleton_built_for_empty_template");
                    }
                    const after = sanitize(content, title);
                    if (after !== before) {
                        changes.push("sanitized_html_and_title");
                    }

                    // Sections sanitation if present
                    let updatedSections = tpl.sections;
                    if (Array.isArray(updatedSections)) {
                        const newSections = updatedSections.map((s: any) => {
                            if (s && typeof s === 'object') {
                                const body = s.content || s.text || "";
                                const cleanBody = sanitize(body, title);
                                if (cleanBody !== body) changes.push(`section_${s.id || s.title}_sanitized`);
                                return { ...s, content: cleanBody };
                            }
                            return s;
                        });
                        updatedSections = newSections as any;
                    }

                    const updated = changes.length > 0;
                    results.push({ id: tpl.id, updated, changes });

                    if (updated && !input?.dryRun) {
                        await db.update(policyTemplates)
                            .set({
                                content: after,
                                sections: updatedSections
                            })
                            .where(eq(policyTemplates.id, tpl.id));
                    }
                }

                return {
                    templatesProcessed: templates.length,
                    templatesChanged: results.filter(r => r.updated).length,
                    dryRun: !!(input?.dryRun),
                    results
                };
            }),
    });
};
