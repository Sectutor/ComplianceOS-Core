import { z } from "zod";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, and } from "drizzle-orm";

// Zod Schema mirroring the JSON Schema
export const PluginManifestSchema = z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    version: z.string(),
    author: z.string(),
    description: z.string(),
    type: z.enum(["General", "Security", "Privacy", "Federal", "Strategic", "Quality"]),
    tags: z.array(z.string()).default([]),
    icon: z.string().optional(),
    minAppVersion: z.string().optional()
});

export const PluginContentSchema = z.object({
    phases: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        order: z.number()
    })),
    requirements: z.array(z.object({
        identifier: z.string(),
        title: z.string(),
        description: z.string(),
        guidance: z.string().optional(),
        phaseName: z.string().optional(),
        mappingTags: z.array(z.string()).optional()
    })),
    policies: z.array(z.object({
        name: z.string(),
        content: z.string(),
        mappedControls: z.array(z.string()).default([])
    })).optional(),
    risks: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        inherentRisk: z.enum(["Low", "Medium", "High", "Critical"]),
        mappedControls: z.array(z.string()).default([])
    })).optional()
});

export const PluginPackageSchema = z.object({
    manifest: PluginManifestSchema,
    content: PluginContentSchema
});

export type PluginPackage = z.infer<typeof PluginPackageSchema>;

export class PluginLoader {

    static validate(jsonContent: any): PluginPackage {
        try {
            return PluginPackageSchema.parse(jsonContent);
        } catch (error: any) {
            throw new Error(`Invalid Plugin Format: ${error.message}`);
        }
    }

    static async install(plugin: PluginPackage) {
        const db = await getDb();
        console.log(`[PluginLoader] Installing ${plugin.manifest.name} v${plugin.manifest.version}...`);

        // 1. Upsert Framework
        const existing = await db.select().from(schema.complianceFrameworks).where(eq(schema.complianceFrameworks.shortCode, plugin.manifest.slug));
        let frameworkId;

        if (existing.length > 0) {
            console.log(`  -> Updating existing framework ID ${existing[0].id}`);
            frameworkId = existing[0].id;
            await db.update(schema.complianceFrameworks).set({
                name: plugin.manifest.name,
                version: plugin.manifest.version,
                description: plugin.manifest.description,
                type: plugin.manifest.type,
                updatedAt: new Date()
            }).where(eq(schema.complianceFrameworks.id, frameworkId));
        } else {
            console.log(`  -> Creating new framework`);
            const [fw] = await db.insert(schema.complianceFrameworks).values({
                name: plugin.manifest.name,
                shortCode: plugin.manifest.slug,
                version: plugin.manifest.version,
                description: plugin.manifest.description,
                type: plugin.manifest.type,
            }).returning();
            frameworkId = fw.id;
        }

        // 2. Sync Phases (Simple approach: Create generic map for linking)
        const phaseMap = new Map<string, number>();

        // First pass: Ensure all phases exist
        for (const phase of plugin.content.phases) {
            const existingPhase = await db.select().from(schema.implementationPhases).where(and(
                eq(schema.implementationPhases.frameworkId, frameworkId),
                eq(schema.implementationPhases.name, phase.name)
            ));

            let phaseId;
            if (existingPhase.length > 0) {
                phaseId = existingPhase[0].id;
                await db.update(schema.implementationPhases).set({
                    description: phase.description,
                    order: phase.order
                }).where(eq(schema.implementationPhases.id, phaseId));
            } else {
                const [ph] = await db.insert(schema.implementationPhases).values({
                    frameworkId,
                    name: phase.name,
                    description: phase.description,
                    order: phase.order
                }).returning();
                phaseId = ph.id;
            }
            phaseMap.set(phase.name, phaseId);
        }

        // 3. Sync Requirements
        for (const req of plugin.content.requirements) {
            if (!req.phaseName || !phaseMap.has(req.phaseName)) {
                console.warn(`  -> Warning: Requirement ${req.identifier} has missing or invalid phase '${req.phaseName}'. Skipping phase link.`);
            }
            const phaseId = req.phaseName ? phaseMap.get(req.phaseName) : null;

            const existingReq = await db.select().from(schema.frameworkRequirements).where(and(
                eq(schema.frameworkRequirements.frameworkId, frameworkId),
                eq(schema.frameworkRequirements.identifier, req.identifier)
            ));

            if (existingReq.length > 0) {
                await db.update(schema.frameworkRequirements).set({
                    title: req.title,
                    description: req.description,
                    guidance: req.guidance,
                    phaseId: phaseId,
                    mappingTags: req.mappingTags
                }).where(eq(schema.frameworkRequirements.id, existingReq[0].id));
            } else {
                await db.insert(schema.frameworkRequirements).values({
                    frameworkId,
                    phaseId,
                    identifier: req.identifier,
                    title: req.title,
                    description: req.description,
                    guidance: req.guidance,
                    mappingTags: req.mappingTags
                });
            }
        }

        // 4. Inject Policies (Admin Library - optional for now, but foundation logic here)
        // ... (Future: Upsert into schema.policyTemplates)

        // 5. Inject Risks
        // ... (Future: Upsert into schema.riskScenarios)

        console.log(`[PluginLoader] Installation of ${plugin.manifest.slug} complete.`);
        return { success: true, frameworkId };
    }
}
