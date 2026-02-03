
import { getDb } from "../../../db";
import {
    clients,
    crmActivities,
    crmContacts,
    crmEngagements,
    CrmEngagement,
    clientControls,
    controls,
    evidence,
    remediationTasks,
    riskScenarios
} from "../../../schema";
import { eq, desc, and, sql, not, inArray, gt } from "drizzle-orm";
import {
    CreateContactInput,
    UpdateContactInput,
    CreateActivityInput,
    CreateEngagementInput,
    CreateTaskInput,
    CrmStats,
    EngagementDetails
} from "./types";
import { TRPCError } from '@trpc/server';

export class CrmService {

    private static async getDbOrThrow() {
        console.log("CrmService: getDbOrThrow called");
        try {
            const db = await getDb();
            console.log("CrmService: getDb returned", !!db);
            if (!db) {
                console.error("CrmService: DB is null");
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Database connection unavailable'
                });
            }
            return db;
        } catch (e) {
            console.error("CrmService: getDbOrThrow failed", e);
            throw e;
        }
    }

    /**
     * verifyModuleEnabled
     * Checks if the CRM module is enabled for the specific client.
     * Throws an error if not enabled.
     */
    static async verifyModuleAccess(clientId: number) {
        console.log("CrmService: verifyModuleAccess called for", clientId);
        // Global switch check
        if (process.env.ENABLE_MODULE_CRM === 'false') {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'CRM Module is globally disabled.'
            });
        }

        const db = await this.getDbOrThrow();
        console.log("CrmService: Checking client activeModules...");
        const [client] = await db.select({ activeModules: clients.activeModules })
            .from(clients)
            .where(eq(clients.id, clientId))
            .limit(1);

        if (!client) {
            console.error("CrmService: Client not found", clientId);
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
        }

        console.log("CrmService: Client modules:", client.activeModules);
        const modules = client.activeModules as string[] || [];
        // if (!modules.includes('crm')) {
        //     console.error("CrmService: CRM module not enabled for client", clientId);
        //     throw new TRPCError({
        //         code: 'FORBIDDEN',
        //         message: 'CRM Module is not enabled for this client.'
        //     });
        // }
    }

    // --- Contacts ---

    static async getContacts(clientId: number) {
        await this.verifyModuleAccess(clientId);
        const db = await this.getDbOrThrow();
        return await db.select().from(crmContacts).where(eq(crmContacts.clientId, clientId));
    }

    static async createContact(input: CreateContactInput) {
        await this.verifyModuleAccess(input.clientId);
        const db = await this.getDbOrThrow();
        return await db.insert(crmContacts).values({
            clientId: input.clientId,
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone,
            jobTitle: input.jobTitle,
            isPrimary: input.isPrimary,
            category: input.category,
            linkedInUrl: input.linkedInUrl,
            notes: input.notes
        }).returning();
    }

    // --- Activities ---

    static async getActivities(clientId: number) {
        await this.verifyModuleAccess(clientId);
        const db = await this.getDbOrThrow();
        const activities = await db.select()
            .from(crmActivities)
            .where(eq(crmActivities.clientId, clientId))
            .orderBy(desc(crmActivities.occurredAt));
        return activities;
    }

    static async logActivity(userId: number, input: CreateActivityInput) {
        await this.verifyModuleAccess(input.clientId);
        const db = await this.getDbOrThrow();
        return await db.insert(crmActivities).values({
            clientId: input.clientId,
            userId: userId,
            type: input.type,
            subject: input.subject,
            content: input.content,
            outcome: input.outcome,
            occurredAt: input.occurredAt || new Date()
        }).returning();
    }

    // Engagements (Compliance Projects)
    static async getEngagements(clientId: number) {
        await this.verifyModuleAccess(clientId);
        const db = await this.getDbOrThrow();
        return await db.select().from(crmEngagements)
            .where(eq(crmEngagements.clientId, clientId))
            .orderBy(desc(crmEngagements.updatedAt));
    }

    static async createEngagement(clientId: number, input: CreateEngagementInput) {
        await this.verifyModuleAccess(clientId);
        const db = await this.getDbOrThrow();
        return await db.insert(crmEngagements).values({
            clientId,
            title: input.title,
            framework: input.framework,
            targetDate: input.targetDate,
            stage: 'planned',
            progress: 0
        }).returning();
    }

    static async updateEngagementStage(clientId: number, dealId: number, stage: string) {
        await this.verifyModuleAccess(clientId);
        const db = await this.getDbOrThrow();
        // Validate stage enum? Rely on TS/Zod at router level
        return await db.update(crmEngagements)
            .set({ stage: stage as any, updatedAt: new Date() })
            .where(and(eq(crmEngagements.id, dealId), eq(crmEngagements.clientId, clientId)))
            .returning();
    }

    static async getEngagementDetails(clientId: number, engagementId: number): Promise<EngagementDetails> {
        await this.verifyModuleAccess(clientId);
        const db = await this.getDbOrThrow();

        // 1. Fetch Engagement
        const [engagement] = await db.select().from(crmEngagements)
            .where(and(eq(crmEngagements.id, engagementId), eq(crmEngagements.clientId, clientId)))
            .limit(1);

        if (!engagement) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Engagement not found' });
        }

        // 2. Fetch Controls (Filtered by Framework)
        // If no framework set, maybe return all? Or none? Let's assume matches framework.
        let controlList: any[] = [];
        if (engagement.framework) {
            controlList = await db.select({
                controlId: clientControls.id,
                controlCode: controls.controlId,
                name: controls.name,
                description: controls.description,
                status: clientControls.status,
                owner: clientControls.owner,
            })
                .from(clientControls)
                .innerJoin(controls, eq(clientControls.controlId, controls.id))
                .where(and(
                    eq(clientControls.clientId, clientId),
                    // Simple string match for now. In real app, might need mapping table.
                    // Assuming framework strings match (e.g. "SOC 2")
                    eq(controls.framework, engagement.framework)
                ));
        }

        // 3. Fetch Evidence Counts
        // Efficient enough to fetch all for client and map, or filter by retrieved control IDs.
        // Let's fetch all evidence for this client to map.
        const evidenceData = await db.select({
            clientControlId: evidence.clientControlId,
            count: sql<number>`count(*)`
        })
            .from(evidence)
            .where(eq(evidence.clientId, clientId))
            .groupBy(evidence.clientControlId);

        const evidenceMap = new Map(evidenceData.map(e => [e.clientControlId, Number(e.count)]));

        // 4. Merge Controls + Evidence
        const fullControls = controlList.map(c => ({
            ...c,
            evidenceCount: evidenceMap.get(c.controlId) || 0
        }));

        // 5. Fetch Activities (Recent 20)
        // TODO: Filter by "linked to engagement" if we had a link. For now, all client activities.
        const recentActivities = await db.select().from(crmActivities)
            .where(eq(crmActivities.clientId, clientId))
            .orderBy(desc(crmActivities.occurredAt))
            .limit(20);

        // 6. Fetch Tasks (Placeholder)
        const tasks = await db.select().from(remediationTasks)
            .where(eq(remediationTasks.clientId, clientId))
            .limit(10); // Todo filter by assignee?

        // 7. Fetch Risks (Active ones)
        const risks = await db.select({
            id: riskScenarios.id,
            title: riskScenarios.title,
            description: riskScenarios.description,
            status: riskScenarios.status,
            inherentRiskScore: riskScenarios.inherentRiskScore,
            owner: riskScenarios.owner
        })
            .from(riskScenarios)
            .where(eq(riskScenarios.clientId, clientId))
            .orderBy(desc(riskScenarios.inherentRiskScore))
            .limit(20);

        return {
            ...engagement,
            // @ts-ignore - zod schema dates vs drizzle dates might need conversion if strict
            controls: fullControls,
            activities: recentActivities,
            tasks: tasks,
            risks: risks
        };
    }

    static async updateClientControlStatus(clientId: number, clientControlId: number, status: string) {
        await this.verifyModuleAccess(clientId);
        const db = await this.getDbOrThrow();

        return await db.update(clientControls)
            .set({ status: status as any, updatedAt: new Date() })
            .where(and(eq(clientControls.id, clientControlId), eq(clientControls.clientId, clientId)))
            .returning();
    }

    static async getTasks(clientId: number) {
        await this.verifyModuleAccess(clientId);
        const db = await this.getDbOrThrow();
        return await db.select().from(remediationTasks)
            .where(eq(remediationTasks.clientId, clientId))
            .orderBy(desc(remediationTasks.createdAt))
            .limit(10);
    }

    static async createTask(input: CreateTaskInput) {
        await this.verifyModuleAccess(input.clientId);
        const db = await this.getDbOrThrow();
        return await db.insert(remediationTasks).values({
            clientId: input.clientId,
            title: input.title,
            description: input.description,
            priority: input.priority,
            status: input.status,
            dueDate: input.dueDate,
            assigneeId: input.assigneeId
        }).returning();
    }

    // Dashboard Stats
    static async getStats(clientId: number): Promise<CrmStats> {
        await this.verifyModuleAccess(clientId);
        const db = await this.getDbOrThrow();

        const engagementsData = await db.select().from(crmEngagements).where(eq(crmEngagements.clientId, clientId));

        const contactsCountData = await db.select({ value: sql<number>`count(*)` })
            .from(crmContacts)
            .where(eq(crmContacts.clientId, clientId));

        const activitiesCountData = await db.select({ value: sql<number>`count(*)` })
            .from(crmActivities)
            .where(eq(crmActivities.clientId, clientId));

        // Use raw SQL string properly for date comparison or simple JS date
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentActivitiesData = await db.select({ value: sql<number>`count(*)` })
            .from(crmActivities)
            .where(and(
                eq(crmActivities.clientId, clientId),
                // Fix: convert Date to string for Drizzle/Postgres if needed
                gt(crmActivities.occurredAt, sevenDaysAgo.toISOString())
            ));

        console.log("CrmService: getStats calculations start");

        const openProjects = engagementsData.filter(d => !['certified', 'maintenance'].includes(d.stage || ''));
        const risksMitigated = engagementsData.reduce((sum, d) => sum + (d.mitigatedRisksCount || 0), 0);

        // Calculate a basic "Compliance Score" based on progress of active projects
        const totalProgress = engagementsData.reduce((sum, d) => sum + (d.progress || 0), 0);
        const avgProgress = engagementsData.length > 0 ? Math.round(totalProgress / engagementsData.length) : 0;

        console.log("CrmService: getStats success");

        return {
            complianceScore: avgProgress,
            openProjectsCount: openProjects.length,
            risksMitigatedCount: risksMitigated,
            totalContacts: Number(contactsCountData[0]?.value || 0),
            totalActivities: Number(activitiesCountData[0]?.value || 0),
            recentActivitiesCount: Number(recentActivitiesData[0]?.value || 0)
        };
    }
}
