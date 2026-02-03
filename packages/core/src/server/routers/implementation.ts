
import { z } from "zod";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, desc, and, or, isNull, asc } from "drizzle-orm";
import { llmService } from "../../lib/llm/service";
import { randomUUID } from "node:crypto";

export const createImplementationRouter = (t: any, publicProcedure: any, adminProcedure: any, protectedProcedure: any) => {
    return t.router({
        list: publicProcedure.input(z.object({
            clientId: z.number()
        })).query(async ({ input }: any) => {
            const db = await getDb();
            const plans = await db.select().from(schema.implementationPlans)
                .where(eq(schema.implementationPlans.clientId, input.clientId))
                .orderBy(desc(schema.implementationPlans.createdAt));
            return plans;
        }),

        create: adminProcedure.input(z.object({
            clientId: z.number(),
            title: z.string(),
            description: z.string().optional()
        })).mutation(async ({ input, ctx }: any) => {
            const db = await getDb();
            const [plan] = await db.insert(schema.implementationPlans).values({
                clientId: input.clientId,
                title: input.title,
                description: input.description,
                status: 'not_started',
                createdById: ctx.user?.id || 1
            }).returning();
            return plan;
        }),

        createFromRoadmap: adminProcedure.input(z.object({
            roadmapId: z.number(),
            clientId: z.number(),
        })).mutation(async ({ input, ctx }: any) => {
            const db = await getDb();

            // 1. Fetch the Source Roadmap (Strategic Vision)
            const roadmap = await db.query.roadmaps.findFirst({
                where: eq(schema.roadmaps.id, input.roadmapId),
                with: {
                    items: true
                }
            });

            if (!roadmap) {
                throw new Error("Roadmap not found");
            }

            // 2. Create the Implementation Plan (Tactical Container)
            const [plan] = await db.insert(schema.implementationPlans).values({
                clientId: input.clientId,
                title: `Execution: ${roadmap.title}`,
                description: `Tactical plan derived from roadmap #${roadmap.id}`,
                status: 'planning',
                roadmapId: roadmap.id,
                createdById: ctx.user?.id || 1
            }).returning();

            // 3. Deterministic Task Generation
            if (roadmap.items && roadmap.items.length > 0) {
                const tasksToInsert = roadmap.items.map((item: any) => ({
                    implementationPlanId: plan.id,
                    clientId: input.clientId,
                    title: item.title,
                    description: item.description || "Imported from roadmap",
                    status: 'backlog',
                    priority: 'medium',
                    sourceRoadmapItemId: item.id,
                    createdById: ctx.user?.id || 1
                }));

                await db.insert(schema.implementationTasks).values(tasksToInsert);
            }

            return { success: true, planId: plan.id, taskCount: roadmap.items.length };
        }),

        // --- Template Operations ---

        listTemplates: publicProcedure.input(z.object({
            clientId: z.number(),
            category: z.string().optional()
        })).query(async ({ input }: any) => {
            const db = await getDb();
            const templates = await db.select().from(schema.implementationTemplates)
                .where(
                    and(
                        // Show system templates OR client specific templates
                        or(
                            eq(schema.implementationTemplates.isSystem, true),
                            eq(schema.implementationTemplates.clientId, input.clientId)
                        ),
                        input.category ? eq(schema.implementationTemplates.category, input.category) : undefined
                    )
                )
                .orderBy(desc(schema.implementationTemplates.isSystem), desc(schema.implementationTemplates.createdAt));
            return templates;
        }),

        createTemplate: adminProcedure.input(z.object({
            clientId: z.number(),
            title: z.string(),
            description: z.string().optional(),
            tasks: z.array(z.object({
                title: z.string(),
                description: z.string().optional(),
                priority: z.string().optional()
            })),
            isSystem: z.boolean().default(false)
        })).mutation(async ({ input, ctx }: any) => {
            const db = await getDb();
            const [template] = await db.insert(schema.implementationTemplates).values({
                clientId: input.isSystem ? null : input.clientId,
                title: input.title,
                description: input.description,
                tasks: input.tasks,
                isSystem: input.isSystem,
                createdById: ctx.user?.id || 1
            }).returning();
            return template;
        }),

        createFromTemplate: adminProcedure.input(z.object({
            templateId: z.number(),
            clientId: z.number(),
            title: z.string(), // Override title
        })).mutation(async ({ input, ctx }: any) => {
            const db = await getDb();

            // 1. Fetch Template
            const [template] = await db.select().from(schema.implementationTemplates)
                .where(eq(schema.implementationTemplates.id, input.templateId))
                .limit(1);

            if (!template) throw new Error("Template not found");

            // 2. Create Plan
            const [plan] = await db.insert(schema.implementationPlans).values({
                clientId: input.clientId,
                title: input.title, // User provided title
                description: template.description || "Created from template",
                status: 'planning',
                priority: template.priority || 'medium',
                createdById: ctx.user?.id || 1
            }).returning();

            // 3. Create Tasks from Template JSON
            const tasksDef = template.tasks as any[];
            if (tasksDef && tasksDef.length > 0) {
                const tasksToInsert = tasksDef.map((t: any) => ({
                    implementationPlanId: plan.id,
                    clientId: input.clientId,
                    title: t.title,
                    description: t.description || "",
                    status: 'backlog', // Templates always start in backlog? Or Todo? Backlog is safer.
                    priority: t.priority || 'medium',
                    createdById: ctx.user?.id || 1
                }));
                await db.insert(schema.implementationTasks).values(tasksToInsert);
            }

            return { success: true, planId: plan.id };
        }),

        cloneTemplate: adminProcedure.input(z.object({
            templateId: z.number(),
            clientId: z.number()
        })).mutation(async ({ input, ctx }: any) => {
            const db = await getDb();

            const [source] = await db.select().from(schema.implementationTemplates)
                .where(eq(schema.implementationTemplates.id, input.templateId))
                .limit(1);

            if (!source) throw new Error("Template not found");

            const [cloned] = await db.insert(schema.implementationTemplates).values({
                clientId: input.clientId,
                title: `${source.title} (Copy)`,
                description: source.description,
                estimatedHours: source.estimatedHours,
                priority: source.priority,
                category: source.category,
                tasks: source.tasks,
                riskMitigationFocus: source.riskMitigationFocus,
                isSystem: false, // Clones are always custom
                createdById: ctx.user?.id || 1
            }).returning();

            return cloned;
        }),

        updateTemplate: adminProcedure.input(z.object({
            templateId: z.number(),
            title: z.string().optional(),
            description: z.string().optional(),
            tasks: z.array(z.any()).optional(), // Loose typing for prototype speed, ideally schema-validated
            priority: z.string().optional(),
            category: z.string().optional()
        })).mutation(async ({ input, ctx }: any) => {
            const db = await getDb();

            const [updated] = await db.update(schema.implementationTemplates)
                .set({
                    title: input.title,
                    description: input.description,
                    tasks: input.tasks,
                    priority: input.priority,
                    category: input.category,
                    updatedAt: new Date()
                })
                .where(eq(schema.implementationTemplates.id, input.templateId))
                .returning();

            return updated;
        }),

        updatePlan: adminProcedure.input(z.object({
            planId: z.number(),
            title: z.string().optional(),
            description: z.string().optional(),
            status: z.string().optional(),
            priority: z.string().optional(),
            frameworkId: z.number().optional()
        })).mutation(async ({ input }: any) => {
            const db = await getDb();
            const [updated] = await db.update(schema.implementationPlans)
                .set({
                    ...input,
                    updatedAt: new Date()
                })
                .where(eq(schema.implementationPlans.id, input.planId))
                .returning();
            return updated;
        }),

        deleteTemplate: adminProcedure.input(z.object({
            templateId: z.number()
        })).mutation(async ({ input, ctx }: any) => {
            const db = await getDb();
            await db.delete(schema.implementationTemplates)
                .where(eq(schema.implementationTemplates.id, input.templateId));
            return { success: true };
        }),

        deletePlan: adminProcedure.input(z.object({
            planId: z.number()
        })).mutation(async ({ input }: any) => {
            const db = await getDb();

            // Delete associated tasks first (soft delete not supported yet, so hard delete)
            await db.delete(schema.implementationTasks)
                .where(eq(schema.implementationTasks.implementationPlanId, input.planId));

            // Delete the plan
            await db.delete(schema.implementationPlans)
                .where(eq(schema.implementationPlans.id, input.planId));

            return { success: true };
        }),

        getPlan: publicProcedure.input(z.object({
            planId: z.number()
        })).query(async ({ input }: any) => {
            const db = await getDb();

            // Fetch Plan with Framework details
            const [plan] = await db.select({
                plan: schema.implementationPlans,
                framework: schema.complianceFrameworks
            })
                .from(schema.implementationPlans)
                .leftJoin(schema.complianceFrameworks, eq(schema.implementationPlans.frameworkId, schema.complianceFrameworks.id))
                .where(eq(schema.implementationPlans.id, input.planId))
                .limit(1);

            if (!plan) return null;

            // Fetch Tasks
            const tasks = await db.select().from(schema.implementationTasks)
                .where(eq(schema.implementationTasks.implementationPlanId, plan.plan.id))
                .orderBy(asc(schema.implementationTasks.id));

            // Enrich tasks with Control Details
            // Runtime Fix: If controlId is missing, try to extract from title (e.g., "A.5.1 ...")
            // This ensures older data works with new features.
            const tasksWithId = tasks.map((t: any) => {
                if (!t.controlId) {
                    // 1. Try Title (e.g. "A.5.1 ...")
                    if (t.title && /^[A-Z0-9]+(\.[A-Z0-9]+)+/.test(t.title)) {
                        return { ...t, controlId: t.title.split(' ')[0] };
                    }
                    // 2. Try Tags (Lookup for tags like "A.5.1", "Clause 4.1", "NIST-RC-IM")
                    if (t.tags && Array.isArray(t.tags)) {
                        // Match alphanumeric strings containing at least one dot or dash, and length > 2
                        const idTag = t.tags.find((tag: string) => /^[A-Z0-9]+[-.][A-Z0-9.-]+$/i.test(tag) && tag.length > 2);
                        if (idTag) return { ...t, controlId: idTag };
                    }
                }
                return t;
            });

            // Collect all control IDs
            const controlIds = tasksWithId.map((t: any) => t.controlId).filter((id: any) => !!id);

            let controlMap: Record<string, any> = {};

            if (controlIds.length > 0) {
                // Try fetching from client_controls first (customized/scoped controls)
                const clientControls = await db.select().from(schema.clientControls)
                    .where(
                        and(
                            eq(schema.clientControls.clientId, plan.plan.clientId),
                            // We can't use 'inArray' easily with string IDs if they aren't unique PKs, but let's try or finding match
                            // For optimization, we'll fetch all controls for this client/framework
                            // But since we don't have 'inArray' for string IDs readily without casting, let's fetch matching controls
                        )
                    );

                // Create a map
                // Better strategy: Since controlId is a string reference (e.g. "A.5.1"), we should look it up.
                // Let's assume we can fetch by framework_id or just all client controls.
                // Optimization: Fetch all Client Controls for this framework if possible, or just all for client.

                // Actually, let's fetch generic controls too if not found.

                // Simplified approach for finding details:
                // 1. Fetch Client Controls matching the IDs (or all for client)
                const cControls = await db.query.clientControls.findMany({
                    where: eq(schema.clientControls.clientId, plan.plan.clientId)
                });

                cControls.forEach((c: any) => {
                    controlMap[c.controlId] = c;
                });

                // 2. Fetch Generic Controls as fallback
                // Fetch all controls for this framework (optimization: we could filter, but fetching all for context is okay for now)
                if (plan.framework) {
                    const gControls = await db.query.controls.findMany({
                        where: eq(schema.controls.framework, plan.framework.name)
                    });

                    gControls.forEach((c: any) => {
                        // Only set if not already set by client control (client override takes precedence)
                        if (!controlMap[c.controlId]) {
                            controlMap[c.controlId] = c;
                        }
                    });
                }
            }

            const enrichedTasks = tasksWithId.map((t: any) => ({
                ...t,
                controlDetails: t.controlId ? controlMap[t.controlId] : null
            }));

            return {
                ...plan.plan,
                framework: plan.framework,
                tasks: enrichedTasks
            };
        }),

        getPlanTasks: publicProcedure.input(z.object({
            planId: z.number()
        })).query(async ({ input }: any) => {
            const db = await getDb();
            const tasks = await db.select().from(schema.implementationTasks)
                .where(eq(schema.implementationTasks.implementationPlanId, input.planId))
                .orderBy(asc(schema.implementationTasks.id));

            return tasks;
        }),

        updateTaskStatus: adminProcedure.input(z.object({
            taskId: z.number(),
            status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done'])
        })).mutation(async ({ input }: any) => {
            const db = await getDb();
            const [updated] = await db.update(schema.implementationTasks)
                .set({
                    status: input.status,
                    updatedAt: new Date()
                })
                .where(eq(schema.implementationTasks.id, input.taskId))
                .returning();
            return updated;
        }),

        assignTask: adminProcedure.input(z.object({
            taskId: z.number(),
            assigneeId: z.number().nullable()
        })).mutation(async ({ input }: any) => {
            const db = await getDb();
            const [updated] = await db.update(schema.implementationTasks)
                .set({
                    assigneeId: input.assigneeId,
                    updatedAt: new Date()
                })
                .where(eq(schema.implementationTasks.id, input.taskId))
                .returning();
            return updated;
        }),

        updateTask: adminProcedure.input(z.object({
            taskId: z.number(),
            title: z.string().optional(),
            description: z.string().optional(),
            subtasks: z.array(z.any()).optional(), // Flexible for metadata like aiSolution/evidence
            priority: z.string().optional(),
            status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done']).optional(),
            pdca: z.string().optional()
        })).mutation(async ({ input }: any) => {
            const db = await getDb();
            const [updated] = await db.update(schema.implementationTasks)
                .set({
                    title: input.title,
                    description: input.description,
                    subtasks: input.subtasks, // Pass subtasks
                    priority: input.priority,
                    status: input.status,
                    pdca: input.pdca,
                    updatedAt: new Date()
                })
                .where(eq(schema.implementationTasks.id, input.taskId))
                .returning();
            return updated;
        }),

        getTeamCapacity: publicProcedure.input(z.object({
            clientId: z.number()
        })).query(async ({ input }: any) => {
            const db = await getDb();
            // Aggregate estimated hours by assignee
            const tasks = await db.select({
                assigneeId: schema.implementationTasks.assigneeId,
                estimatedHours: schema.implementationTasks.estimatedHours,
                status: schema.implementationTasks.status
            })
                .from(schema.implementationTasks)
                .leftJoin(schema.implementationPlans, eq(schema.implementationTasks.implementationPlanId, schema.implementationPlans.id))
                .where(eq(schema.implementationPlans.clientId, input.clientId));

            // Fetch user details for names
            const users = await db.select().from(schema.users);
            const userMap = new Map(users.map((u: any) => [u.id, u.name || u.email]));

            const capacity: Record<string, number> = {};

            tasks.forEach((t: any) => {
                if (t.assigneeId && t.status !== 'done') {
                    const userName = (userMap.get(t.assigneeId) as string) || `User ${t.assigneeId}`;
                    capacity[userName] = (capacity[userName] || 0) + (t.estimatedHours || 0);
                }
            });

            // Format for Recharts
            return Object.entries(capacity).map(([name, hours]) => ({
                name,
                hours
            }));
        }),



        autoAssignPdca: adminProcedure.input(z.object({
            planId: z.number()
        })).mutation(async ({ input, ctx }: any) => {
            const db = await getDb();
            const tasks = await db.select().from(schema.implementationTasks)
                .where(eq(schema.implementationTasks.implementationPlanId, input.planId));

            if (tasks.length === 0) return { success: true, updatedCount: 0 };

            // 1. Prepare AI Prompt for Orchestration
            const taskContext = tasks.map((tItem: any) => `- "${tItem.title}": ${tItem.description || "No description"}`).join('\n');
            const prompt = `
            You are a GRC (Governance, Risk, and Compliance) Orchestrator.
            I have a list of high-level compliance activities for an implementation plan.
            Your goal is to "explode" these activities into a granular PDCA (Plan-Do-Check-Act) lifecycle.

            Current Activities:
            ${taskContext}

            For each activity, generate exactly 4 specific, actionable tasks (one for each phase):
            - PLAN: Policy, methodology, scope, or planning related to the activity.
            - DO: Implementation, configuration, or execution.
            - CHECK: Audit, monitor, test, or verify effectiveness.
            - ACT: Improvement, corrective action, or management assertion.

            RETURN ONLY A VALID JSON OBJECT WITH A "tasks" ARRAY. 
            Format:
            {
              "tasks": [
                { "sourceTitle": "Original Title", "title": "Decomposed Task Title", "description": "Details", "pdca": "Plan|Do|Check|Act" },
                ...
              ]
            }
            `;

            try {
                const response = await llmService.generate({
                    userPrompt: prompt,
                    systemPrompt: "You are a JSON-only GRC API. Return ONLY a raw JSON object with a 'tasks' array. No markdown, no preamble, no explanation. Just { \"tasks\": [ ... ] }",
                    feature: "pdca_orchestration",
                    temperature: 0.1,
                    jsonMode: true
                });

                let newTasksDef: any = null;
                const rawText = response.text.trim();

                // Helper to find the best array in an object
                const findDeepArray = (obj: any): any[] | null => {
                    if (Array.isArray(obj)) return obj;
                    if (!obj || typeof obj !== 'object') return null;

                    // Look for common keys
                    if (Array.isArray(obj.tasks)) return obj.tasks;
                    if (Array.isArray(obj.activities)) return obj.activities;
                    if (Array.isArray(obj.items)) return obj.items;
                    if (Array.isArray(obj.pdca)) return obj.pdca;
                    if (Array.isArray(obj.response)) return obj.response;
                    if (Array.isArray(obj.data)) return obj.data;
                    if (Array.isArray(obj.result)) return obj.result;
                    if (Array.isArray(obj.results)) return obj.results;

                    // Greedily find ANY array with objects
                    const arrays = Object.values(obj).filter(v => Array.isArray(v));
                    if (arrays.length > 0) {
                        // Return the longest array
                        return (arrays as any[][]).reduce((a, b) => a.length > b.length ? a : b);
                    }
                    return null;
                };

                try {
                    // Try to parse the raw text as JSON
                    const jsonMatch = rawText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
                    const jsonToParse = jsonMatch ? jsonMatch[0] : rawText;
                    const parsed = JSON.parse(jsonToParse);
                    
                    // Look for the tasks array
                    newTasksDef = findDeepArray(parsed);
                } catch (pe) {
                    console.error("PDCA Orchestration Parse Error:", rawText);
                    throw new Error("AI response was not valid JSON.");
                }

                if (!Array.isArray(newTasksDef)) {
                    throw new Error("No task array found in AI response. Expected a JSON object with a 'tasks' array.");
                }

                // 2. Insert new tasks
                const tasksToInsert = newTasksDef.map((tItem: any) => ({
                    implementationPlanId: input.planId,
                    clientId: tasks[0].clientId,
                    title: tItem.title || tItem.name || "Untitled Decomposed Task",
                    description: tItem.description || tItem.details || "",
                    status: 'todo',
                    priority: 'medium',
                    pdca: (tItem.pdca || 'Plan').charAt(0).toUpperCase() + (tItem.pdca || 'Plan').slice(1).toLowerCase(),
                    createdById: ctx.user?.id || 1
                }));

                // 3. Transformation: Delete ALL current tasks in the plan and replace them with orchestrated ones
                await db.delete(schema.implementationTasks)
                    .where(eq(schema.implementationTasks.implementationPlanId, input.planId));

                await db.insert(schema.implementationTasks).values(tasksToInsert);

                return { success: true, updatedCount: tasksToInsert.length };

            } catch (error: any) {
                console.error("PDCA Orchestration Failed:", error);
                throw new Error("Failed to orchestrate lifecycle: " + error.message);
            }
        }),

        generateSubtasks: adminProcedure.input(z.object({
            taskId: z.number().optional(),
            title: z.string(),
            description: z.string().optional(),
            pdca: z.string().optional()
        })).mutation(async ({ input }: any) => {
            const prompt = `
            Context: Implementing a compliance task titled "${input.title}".
            Description: ${input.description || "No specific details provided."}
            Phase: ${input.pdca || "General Implementation"}
            
            Task: Generate 3-6 specific, actionable subtasks (checklist items) to complete this task.
            Format: RETURN ONLY A JSON ARRAY of strings. Example: ["Review current policy", "Draft new controls"]
            Constraint: Be concise/professional. No introductory text.
            `;

            try {
                const response = await llmService.generate({
                    userPrompt: prompt,
                    systemPrompt: "You are a senior compliance officer helping break down implementation tasks.",
                    feature: "task_breakdown",
                    temperature: 0.5,
                    maxTokens: 500,
                    jsonMode: true
                });

                let subtasks: string[] = [];
                try {
                    // Try parsing as simple array
                    const parsed = JSON.parse(response.text);
                    if (Array.isArray(parsed)) {
                        subtasks = parsed;
                    } else if (parsed.subtasks && Array.isArray(parsed.subtasks)) {
                        // Handle { subtasks: [...] } wrapper
                        subtasks = parsed.subtasks;
                    }
                } catch (e) {
                    // Fallback: split by newlines if JSON fails but returned valid text
                    subtasks = response.text.split('\n').filter((l: string) => l.trim().length > 0).map((l: string) => l.replace(/^[-*•\d\.]+\s+/, ''));
                }

                // Format for frontend
                return subtasks.map((title: string) => ({
                    id: randomUUID(),
                    title: title,
                    completed: false
                }));

            } catch (error: any) {
                console.error("AI Subtask Generation Failed:", error);
                throw new Error("Failed to generate subtasks: " + error.message);
            }
        }),

        generateSubtaskSolution: adminProcedure.input(z.object({
            taskId: z.number(),
            subtaskTitle: z.string(),
            taskTitle: z.string(),
            taskDescription: z.string().optional()
        })).mutation(async ({ input }: any) => {
            const prompt = `
            Task Context: ${input.taskTitle}
            Task Description: ${input.taskDescription || "N/A"}
            Specific Subtask to Solve: "${input.subtaskTitle}"
            
            Action: Generate a detailed, professional solution or content for this specific subtask. 
            - If it's a "Draft policy" task, provide a robust policy template/sample.
            - If it's a "Configure" task, provide clear technical steps.
            - If it's a "Review" task, provide a checklist of what to look for.
            
            Format: Markdown. 
            Tone: Professional, expert compliance advisor.
            Constraint: Focus ONLY on the subtask "${input.subtaskTitle}".
            `;

            try {
                const response = await llmService.generate({
                    userPrompt: prompt,
                    systemPrompt: "You are an expert compliance automation engine providing high-quality remediation content.",
                    feature: "subtask_remediation",
                    temperature: 0.7,
                    maxTokens: 1500
                });

                return { content: response.text };
            } catch (error: any) {
                console.error("AI Subtask Remediation Failed:", error);
                throw new Error("Failed to generate solution: " + error.message);
            }
        }),

        attachSubtaskEvidence: adminProcedure.input(z.object({
            taskId: z.number(),
            subtaskId: z.string(),
            evidence: z.object({
                filename: z.string(),
                url: z.string(),
                key: z.string()
            })
        })).mutation(async ({ input }: any) => {
            const db = await getDb();

            // 1. Fetch Task and Plan
            const task = await db.query.implementationTasks.findFirst({
                where: eq(schema.implementationTasks.id, input.taskId)
            });

            if (!task) throw new Error("Task not found");

            const plan = await db.query.implementationPlans.findFirst({
                where: eq(schema.implementationPlans.id, task.implementationPlanId)
            });

            if (!plan) throw new Error("Plan not found");

            // 2. Try to link to Central Evidence Repository
            if (task.controlId) {
                const clientControl = await db.query.clientControls.findFirst({
                    where: and(
                        eq(schema.clientControls.controlId, task.controlId),
                        eq(schema.clientControls.clientId, plan.clientId)
                    )
                });

                if (clientControl) {
                    await db.insert(schema.evidence).values({
                        clientId: plan.clientId,
                        clientControlId: clientControl.id,
                        evidenceId: randomUUID(), // Internal ID
                        description: `Evidence for subtask in "${task.title}"`,
                        type: 'file',
                        status: 'collected',
                        location: input.evidence.url,
                        owner: 'Implementation Team',
                        createdAt: new Date()
                    });
                }
            }

            // 3. Update Subtask
            const currentSubtasks = (task.subtasks as any[]) || [];
            const updatedSubtasks = currentSubtasks.map((st: any) => {
                if (st.id === input.subtaskId) {
                    return {
                        ...st,
                        completed: true, // Auto-complete
                        evidenceId: input.evidence.key,
                        evidenceUrl: input.evidence.url,
                        filename: input.evidence.filename
                    };
                }
                return st;
            });

            await db.update(schema.implementationTasks)
                .set({
                    subtasks: updatedSubtasks,
                    updatedAt: new Date()
                })
                .where(eq(schema.implementationTasks.id, input.taskId));

            return { success: true };
        }),

        getFrameworkRequirements: publicProcedure.input(z.object({
            frameworkId: z.number()
        })).query(async ({ input }: any) => {
            const db = await getDb();
            const requirements = await db.select({
                requirement: schema.frameworkRequirements,
                phase: schema.implementationPhases
            })
                .from(schema.frameworkRequirements)
                .leftJoin(schema.implementationPhases, eq(schema.frameworkRequirements.phaseId, schema.implementationPhases.id))
                .where(eq(schema.frameworkRequirements.frameworkId, input.frameworkId))
                .orderBy(asc(schema.frameworkRequirements.id));

            return requirements;
        }),

        getFrameworkPhases: publicProcedure.input(z.object({
            frameworkId: z.number()
        })).query(async ({ input }: any) => {
            const db = await getDb();
            const phases = await db.select().from(schema.implementationPhases)
                .where(eq(schema.implementationPhases.frameworkId, input.frameworkId))
                .orderBy(asc(schema.implementationPhases.order));
            return phases;
        }),

        seedBaselineTasks: adminProcedure.input(z.object({
            planId: z.number(),
            frameworkId: z.number()
        })).mutation(async ({ input, ctx }: any) => {
            const db = await getDb();

            // 1. Fetch requirements
            const requirements = await db.select({
                requirement: schema.frameworkRequirements,
                phase: schema.implementationPhases
            })
                .from(schema.frameworkRequirements)
                .leftJoin(schema.implementationPhases, eq(schema.frameworkRequirements.phaseId, schema.implementationPhases.id))
                .where(eq(schema.frameworkRequirements.frameworkId, input.frameworkId));

            if (requirements.length === 0) {
                throw new Error("No baseline requirements found for this framework.");
            }

            // 2. Insert tasks
            const tasksToInsert = requirements.map((r: any) => ({
                implementationPlanId: input.planId,
                clientId: (ctx as any).clientId || 1, // Fallback for simulation
                title: r.requirement.title,
                description: r.requirement.description,
                status: 'backlog',
                priority: 'medium',
                pdca: r.phase?.name || 'Plan', // Map phase name to PDCA
                // Attempt to extract Control ID from title (e.g., "A.5.1 Information Security Policy" -> "A.5.1")
                // This is a heuristic since we don't have a direct link in the requirements table yet
                controlId: r.requirement.title.split(' ')[0].trim(),
                tags: r.requirement.mappingTags || [], // Propagate tags for UI views
                createdById: ctx.user?.id || 1
            }));

            await db.insert(schema.implementationTasks).values(tasksToInsert);

            return { success: true, count: tasksToInsert.length };
        }),

        getMyTasks: protectedProcedure.query(async ({ ctx }: any) => {
            const db = await getDb();
            const userId = ctx.user.id;

            const tasks = await db.select({
                task: schema.implementationTasks,
                planTitle: schema.implementationPlans.title
            })
                .from(schema.implementationTasks)
                .leftJoin(schema.implementationPlans, eq(schema.implementationTasks.implementationPlanId, schema.implementationPlans.id))
                .where(
                    and(
                        eq(schema.implementationTasks.assigneeId, userId),
                        or(
                            eq(schema.implementationTasks.status, 'todo'),
                            eq(schema.implementationTasks.status, 'in_progress')
                        )
                    )
                )
                .orderBy(asc(schema.implementationTasks.plannedEndDate));

            return tasks.map((t: any) => ({
                ...t.task,
                planTitle: t.planTitle
            }));
        })
    });
};
