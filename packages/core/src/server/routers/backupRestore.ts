import { z } from "zod";
import { getDb } from "../../db";
import { eq, and } from "drizzle-orm";
import {
    clientFrameworks,
    clientControls,
    clientPolicies,
    riskScenarios,
    assets,
    controls,
    policyTemplates
} from "../../schema";
import { TRPCError } from "@trpc/server";

// =============================================================================
// Backup/Restore Input Validation Schemas
// =============================================================================
// These schemas validate the structure of backup data while allowing flexibility
// for backward compatibility with older backup formats.

/**
 * Validates that a value is an array where items can be serialized.
 * We accept any non-null value that can be part of a backup, including
 * Date objects, strings, numbers, etc. The sanitizeForSerialization function
 * handles the actual conversion.
 */
const backupArraySchema = z.array(z.any())
    .refine(
        (arr) => arr !== null && Array.isArray(arr),
        { message: "Backup data must be an array" }
    );

/**
 * Schema for backup data structure - validates the overall shape
 * while being flexible about individual fields for backward compatibility
 */
const BackupDataSchema = z.object({
    frameworks: backupArraySchema.optional(),
    controls: backupArraySchema.optional(),
    policies: backupArraySchema.optional(),
    risks: backupArraySchema.optional(),
    assets: backupArraySchema.optional()
}).optional();

/**
 * Schema for the entire backup object - supports both new (nested data)
 * and old (top-level arrays) formats for backward compatibility
 */
const BackupSchema = z.object({
    version: z.string().optional(),
    timestamp: z.string().optional(),
    data: BackupDataSchema,
    // Legacy format support: top-level arrays
    frameworks: backupArraySchema.optional(),
    controls: backupArraySchema.optional(),
    policies: backupArraySchema.optional(),
    risks: backupArraySchema.optional(),
    assets: backupArraySchema.optional()
});

const ImportBackupInputSchema = z.object({
    clientId: z.number().positive("Client ID must be a positive number"),
    backup: BackupSchema
});

export const createBackupRestoreRouter = (t: any, clientProcedure: any) => {
    return t.router({
        exportOrgBackup: clientProcedure
            .input(z.object({
                clientId: z.number()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                try {
                    const frameworks = await db.select().from(clientFrameworks).where(eq(clientFrameworks.clientId, input.clientId));

                    // Join with master controls to get the portable controlId (string)
                    const dbControls = await db.select({
                        clientControl: clientControls,
                        masterControlId: controls.controlId,
                        masterFramework: controls.framework
                    })
                        .from(clientControls)
                        .leftJoin(controls, eq(clientControls.controlId, controls.id))
                        .where(eq(clientControls.clientId, input.clientId));

                    // Join with master templates to get portable template name
                    const dbPolicies = await db.select({
                        clientPolicy: clientPolicies,
                        templateName: policyTemplates.name
                    })
                        .from(clientPolicies)
                        .leftJoin(policyTemplates, eq(clientPolicies.templateId, policyTemplates.id))
                        .where(eq(clientPolicies.clientId, input.clientId));

                    const dbRisks = await db.select().from(riskScenarios).where(eq(riskScenarios.clientId, input.clientId));
                    const dbAssets = await db.select().from(assets).where(eq(assets.clientId, input.clientId));

                    const backupData = {
                        version: "1.1", // Bumped version for portable IDs
                        timestamp: new Date().toISOString(),
                        clientId: input.clientId,
                        data: {
                            frameworks,
                            controls: dbControls.map(c => ({
                                ...c.clientControl,
                                masterControlId: c.masterControlId,
                                masterFramework: c.masterFramework
                            })),
                            policies: dbPolicies.map(p => ({
                                ...p.clientPolicy,
                                templateName: p.templateName
                            })),
                            risks: dbRisks,
                            assets: dbAssets
                        }
                    };

                    return { success: true, backup: backupData };
                } catch (e: any) {
                    console.error("Backup export failed", e);
                    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate backup: " + e.message });
                }
            }),

        importOrgBackup: clientProcedure
            .input(ImportBackupInputSchema)
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();

                try {
                    // DEBUG: Log to console only (not file) for production safety
                    const isProduction = process.env.NODE_ENV === 'production';
                    if (!isProduction) {
                        console.log(`[Backup Import] Start for client ${input.clientId}`);
                    }

                    const data = input.backup.data || (input.backup as any);

                    // Helper function to safely convert any value to ISO string or null
                    const toISOString = (value: any): string | null => {
                        if (value === null || value === undefined) return null;
                        if (value instanceof Date) return value.toISOString();
                        if (typeof value === 'string') return value;
                        if (typeof value === 'number') return new Date(value).toISOString();
                        return String(value);
                    };

                    // Helper to restore dates for Drizzle insertion (Drizzle needs Date objects, not strings)
                    const sanitizeForSerialization = (obj: any): any => {
                        if (obj === null || obj === undefined) return null;
                        if (obj instanceof Date) return obj;
                        if (typeof obj === 'string') {
                            // Convert ISO timestamp strings back to Date objects
                            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
                                const d = new Date(obj);
                                if (!isNaN(d.getTime())) return d;
                            }
                            return obj;
                        }
                        if (Array.isArray(obj)) return obj.map(sanitizeForSerialization);
                        if (typeof obj === 'object') {
                            const result: any = {};
                            for (const key of Object.keys(obj)) {
                                result[key] = sanitizeForSerialization(obj[key]);
                            }
                            return result;
                        }
                        return obj;
                    };

                    // Use transaction to ensure all operations succeed or fail together
                    await db.transaction(async (tx) => {
                        // 1. Frameworks
                        if (data.frameworks && data.frameworks.length > 0) {
                            for (const item of data.frameworks) {
                                // Sanitize dates in the item before processing
                                const sanitizedItem = sanitizeForSerialization(item);

                                const existing = await tx.select().from(clientFrameworks)
                                    .where(and(eq(clientFrameworks.clientId, input.clientId), eq(clientFrameworks.name, sanitizedItem.name)))
                                    .limit(1);

                                const frameworkValues = { ...sanitizedItem };
                                delete frameworkValues.id;
                                delete frameworkValues.clientId;
                                delete frameworkValues.importedAt;
                                delete frameworkValues.createdAt;
                                delete frameworkValues.updatedAt;

                                if (existing.length > 0) {
                                    await tx.update(clientFrameworks)
                                        .set({
                                            status: sanitizedItem.status,
                                            updatedAt: new Date()
                                        })
                                        .where(eq(clientFrameworks.id, existing[0].id));
                                } else {
                                    await tx.insert(clientFrameworks).values({ ...frameworkValues, clientId: input.clientId });
                                }
                            }
                        }

                        // 2. Controls
                        if (data.controls && data.controls.length > 0) {
                            for (const item of data.controls) {
                                // Sanitize dates in the item before processing
                                const sanitizedItem = sanitizeForSerialization(item);

                                // Try to resolve controlId (integer) using masterControlId (string) + masterFramework (string)
                                const masterControlId = sanitizedItem.masterControlId;
                                const masterFramework = sanitizedItem.masterFramework;
                                let targetControlId: number | null = null;

                                if (masterControlId && masterFramework) {
                                    const masterControl = await tx.select({ id: controls.id })
                                        .from(controls)
                                        .where(and(eq(controls.controlId, masterControlId), eq(controls.framework, masterFramework)))
                                        .limit(1);

                                    if (masterControl.length > 0) {
                                        targetControlId = masterControl[0].id;
                                    }
                                }

                                // Fallback for older backups: Try to find by name from master library
                                if (!targetControlId && sanitizedItem.name) {
                                    const masterControlByName = await tx.select({ id: controls.id })
                                        .from(controls)
                                        .where(eq(controls.name, sanitizedItem.name))
                                        .limit(1);

                                    if (masterControlByName.length > 0) {
                                        targetControlId = masterControlByName[0].id;
                                    }
                                }

                                if (!targetControlId) {
                                    console.warn(`Skipping control "${sanitizedItem.name || sanitizedItem.id}": No master control match found`);
                                    continue; // Skip items that cannot be mapped
                                }

                                const existing = await tx.select().from(clientControls)
                                    .where(and(eq(clientControls.clientId, input.clientId), eq(clientControls.controlId, targetControlId)))
                                    .limit(1);

                                const controlValues = { ...sanitizedItem };
                                delete controlValues.id;
                                delete controlValues.clientId;
                                delete controlValues.createdAt;
                                delete controlValues.updatedAt;
                                delete controlValues.masterControlId;
                                delete controlValues.masterFramework;

                                // Re-apply resolved ID
                                controlValues.controlId = targetControlId;

                                if (existing.length > 0) {
                                    await tx.update(clientControls)
                                        .set({
                                            status: sanitizedItem.status,
                                            implementationNotes: sanitizedItem.implementationNotes || sanitizedItem.implementationDetails,
                                            updatedAt: new Date()
                                        })
                                        .where(eq(clientControls.id, existing[0].id));
                                } else {
                                    await tx.insert(clientControls).values({ ...controlValues, clientId: input.clientId });
                                }
                            }
                        }

                        // 3. Policies
                        if (data.policies && data.policies.length > 0) {
                            for (const item of data.policies) {
                                // Sanitize dates in the item before processing
                                const sanitizedItem = sanitizeForSerialization(item);

                                // Resolve templateId using templateName
                                let targetTemplateId: number | null = null;

                                if (sanitizedItem.templateName) {
                                    const masterTemplate = await tx.select({ id: policyTemplates.id })
                                        .from(policyTemplates)
                                        .where(eq(policyTemplates.name, sanitizedItem.templateName))
                                        .limit(1);
                                    if (masterTemplate.length > 0) {
                                        targetTemplateId = masterTemplate[0].id;
                                    }
                                }

                                if (!targetTemplateId) {
                                    console.warn(`Skipping policy "${sanitizedItem.name || sanitizedItem.id}": No template match found`);
                                    continue;
                                }

                                const existing = await tx.select().from(clientPolicies)
                                    .where(and(eq(clientPolicies.clientId, input.clientId), eq(clientPolicies.templateId, targetTemplateId)))
                                    .limit(1);

                                const policyValues = { ...sanitizedItem };
                                delete policyValues.id;
                                delete policyValues.clientId;
                                delete policyValues.createdAt;
                                delete policyValues.updatedAt;
                                delete policyValues.templateName;

                                // Handle date fields - ensure they're proper Date objects or null
                                if (policyValues.reviewDueDate) {
                                    const d = new Date(policyValues.reviewDueDate);
                                    policyValues.reviewDueDate = isNaN(d.getTime()) ? null : d;
                                }
                                if (policyValues.lastReviewAlertSentAt) {
                                    const d = new Date(policyValues.lastReviewAlertSentAt);
                                    policyValues.lastReviewAlertSentAt = isNaN(d.getTime()) ? null : d;
                                }
                                if (policyValues.nextReviewDate) {
                                    const d = new Date(policyValues.nextReviewDate);
                                    policyValues.nextReviewDate = isNaN(d.getTime()) ? null : d;
                                }

                                // Re-apply resolved ID
                                policyValues.templateId = targetTemplateId;

                                if (existing.length > 0) {
                                    await tx.update(clientPolicies)
                                        .set({
                                            status: sanitizedItem.status,
                                            content: sanitizedItem.content,
                                            updatedAt: new Date()
                                        })
                                        .where(eq(clientPolicies.id, existing[0].id));
                                } else {
                                    await tx.insert(clientPolicies).values({ ...policyValues, clientId: input.clientId });
                                }
                            }
                        }

                        // 4. Risks
                        if (data.risks && data.risks.length > 0) {
                            for (const item of data.risks) {
                                // Sanitize dates in the item before processing
                                const sanitizedItem = sanitizeForSerialization(item);

                                const existing = await tx.select().from(riskScenarios)
                                    .where(and(eq(riskScenarios.clientId, input.clientId), eq(riskScenarios.title, sanitizedItem.title)))
                                    .limit(1);

                                const riskValues = { ...sanitizedItem };
                                delete riskValues.id;
                                delete riskValues.clientId;
                                delete riskValues.createdAt;
                                delete riskValues.updatedAt;

                                // Nullify asset/vendor links as they might not match in new system
                                // Advanced version would map these using the exported asset data
                                delete riskValues.assetId;
                                delete riskValues.vendorId;

                                // Handle date fields - ensure they're proper Date objects or null
                                if (riskValues.lastAssessedAt) {
                                    const d = new Date(riskValues.lastAssessedAt);
                                    riskValues.lastAssessedAt = isNaN(d.getTime()) ? null : d;
                                }
                                if (riskValues.nextAssessmentDate) {
                                    const d = new Date(riskValues.nextAssessmentDate);
                                    riskValues.nextAssessmentDate = isNaN(d.getTime()) ? null : d;
                                }

                                if (existing.length > 0) {
                                    await tx.update(riskScenarios)
                                        .set({
                                            status: sanitizedItem.status,
                                            description: sanitizedItem.description,
                                            updatedAt: new Date()
                                        })
                                        .where(eq(riskScenarios.id, existing[0].id));
                                } else {
                                    await tx.insert(riskScenarios).values({ ...riskValues, clientId: input.clientId });
                                }
                            }
                        }

                        // 5. Assets
                        if (data.assets && data.assets.length > 0) {
                            for (const item of data.assets) {
                                // Sanitize dates in the item before processing
                                const sanitizedItem = sanitizeForSerialization(item);

                                const existing = await tx.select().from(assets)
                                    .where(and(eq(assets.clientId, input.clientId), eq(assets.name, sanitizedItem.name)))
                                    .limit(1);

                                const assetValues = { ...sanitizedItem };
                                delete assetValues.id;
                                delete assetValues.clientId;
                                delete assetValues.createdAt;
                                delete assetValues.updatedAt;

                                if (existing.length > 0) {
                                    await tx.update(assets)
                                        .set({
                                            description: sanitizedItem.description,
                                            updatedAt: new Date()
                                        })
                                        .where(eq(assets.id, existing[0].id));
                                } else {
                                    await tx.insert(assets).values({ ...assetValues, clientId: input.clientId });
                                }
                            }
                        }

                        return { success: true };
                    });
                } catch (e: any) {
                    console.error("Backup import failed", e);

                    // DEBUG: Log errors to console only in non-production
                    const isProduction = process.env.NODE_ENV === 'production';
                    if (!isProduction) {
                        console.error(`[Backup Import Error] ${new Date().toISOString()}: ${e.message}`);
                    }

                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: `Failed to import backup: ${String(e.message || "Unknown error")}`
                    });
                }
            }),

        importSpreadsheetData: clientProcedure
            .input(z.object({
                clientId: z.number(),
                type: z.enum(["controls", "risks", "assets", "policies"]),
                data: z.array(z.record(z.any()))
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                const { clientId, type, data } = input;

                try {
                    if (type === "risks") {
                        for (const item of data) {
                            const title = item.title || item.Name || item.Scenario;
                            if (!title) continue;

                            const riskValues = { ...item };
                            if (!riskValues.title) riskValues.title = title;

                            if (riskValues.lastAssessedAt) {
                                const d = new Date(riskValues.lastAssessedAt);
                                riskValues.lastAssessedAt = isNaN(d.getTime()) ? null : d;
                            }
                            if (riskValues.nextAssessmentDate) {
                                const d = new Date(riskValues.nextAssessmentDate);
                                riskValues.nextAssessmentDate = isNaN(d.getTime()) ? null : d;
                            }

                            const existing = await db.select().from(riskScenarios)
                                .where(and(eq(riskScenarios.clientId, clientId), eq(riskScenarios.title, title)))
                                .limit(1);

                            if (existing.length > 0) {
                                await db.update(riskScenarios)
                                    .set({ ...riskValues, updatedAt: new Date() })
                                    .where(eq(riskScenarios.id, existing[0].id));
                            } else {
                                await db.insert(riskScenarios).values({ ...riskValues, clientId });
                            }
                        }
                    } else if (type === "assets") {
                        for (const item of data) {
                            const name = item.name || item.Name || item.Asset;
                            if (!name) continue;

                            const assetValues = { ...item };
                            if (!assetValues.name) assetValues.name = name;

                            delete assetValues.id;
                            delete assetValues.clientId;
                            delete assetValues.createdAt;
                            delete assetValues.updatedAt;

                            const existing = await db.select().from(assets)
                                .where(and(eq(assets.clientId, clientId), eq(assets.name, name)))
                                .limit(1);

                            if (existing.length > 0) {
                                await db.update(assets)
                                    .set({ ...assetValues, updatedAt: new Date() })
                                    .where(eq(assets.id, existing[0].id));
                            } else {
                                await db.insert(assets).values({ ...assetValues, clientId });
                            }
                        }
                    } else if (type === "policies") {
                        for (const item of data) {
                            const name = item.name || item.Name || item.Policy;
                            if (!name) continue;

                            const policyValues = { ...item };
                            if (!policyValues.name) policyValues.name = name;

                            delete policyValues.id;
                            delete policyValues.clientId;
                            delete policyValues.createdAt;
                            delete policyValues.updatedAt;
                            delete policyValues.templateName;

                            // Handle date fields securely (prevents Drizzle from crashing on Invalid Date)
                            if (policyValues.reviewDueDate) {
                                const d = new Date(policyValues.reviewDueDate);
                                policyValues.reviewDueDate = isNaN(d.getTime()) ? null : d;
                            }
                            if (policyValues.lastReviewAlertSentAt) {
                                const d = new Date(policyValues.lastReviewAlertSentAt);
                                policyValues.lastReviewAlertSentAt = isNaN(d.getTime()) ? null : d;
                            }
                            if (policyValues.nextReviewDate) {
                                const d = new Date(policyValues.nextReviewDate);
                                policyValues.nextReviewDate = isNaN(d.getTime()) ? null : d;
                            }

                            const existing = await db.select().from(clientPolicies)
                                .where(and(eq(clientPolicies.clientId, clientId), eq(clientPolicies.name, name)))
                                .limit(1);

                            if (existing.length > 0) {
                                await db.update(clientPolicies)
                                    .set({ ...policyValues, updatedAt: new Date() })
                                    .where(eq(clientPolicies.id, existing[0].id));
                            } else {
                                await db.insert(clientPolicies).values({ ...policyValues, clientId });
                            }
                        }
                    } else if (type === "controls") {
                        for (const item of data) {
                            const controlId = item.controlCode || item.controlId || item.ControlCode || item.ControlID;
                            if (!controlId) continue;

                            // Import into master controls table as client-specific entries
                            const existing = await db.select().from(controls)
                                .where(and(
                                    eq(controls.clientId, clientId),
                                    eq(controls.controlId, controlId)
                                ))
                                .limit(1);

                            const controlValues = { ...item };
                            delete controlValues.id;
                            delete controlValues.clientId;
                            delete controlValues.createdAt;
                            delete controlValues.updatedAt;

                            controlValues.clientId = clientId;
                            controlValues.controlId = controlId;
                            controlValues.framework = item.framework || item.Framework || "Imported";
                            controlValues.updatedAt = new Date();

                            if (existing.length > 0) {
                                await db.update(controls)
                                    .set(controlValues)
                                    .where(eq(controls.id, existing[0].id));
                            } else {
                                await db.insert(controls).values(controlValues);
                            }
                        }
                    }

                    return { success: true, count: data.length };
                } catch (error: any) {
                    console.error("Spreadsheet import failed", error);
                    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
                }
            })
    });
};


