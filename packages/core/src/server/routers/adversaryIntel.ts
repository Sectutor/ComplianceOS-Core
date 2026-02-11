
import { z } from "zod";
import * as adversaryService from "../../lib/adversaryService";
import { TRPCError } from "@trpc/server";

export const createAdversaryIntelRouter = (t: any, publicProcedure: any, clientProcedure: any) => t.router({
    // Get aggregated security feeds
    getSecurityFeeds: clientProcedure
        .input(z.object({
            limit: z.number().optional().default(50),
            clientId: z.number().optional()
        }))
        .query(async ({ input }: any) => {
            try {
                const items = await adversaryService.fetchSecurityFeeds(input.limit);
                return { items, lastUpdated: new Date() };
            } catch (error: any) {
                console.error("Failed to fetch security feeds:", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch security feeds",
                    cause: error
                });
            }
        }),

    // Manually refresh feeds (clear cache)
    refreshFeeds: clientProcedure
        .input(z.object({
            clientId: z.number().optional()
        }))
        .mutation(async () => {
            adversaryService.clearCaches();
            // Re-fetch to warm cache
            const items = await adversaryService.fetchSecurityFeeds(50);
            return { success: true, count: items.length };
        }),

    // Get MITRE ATT&CK Data
    getMitreData: clientProcedure
        .input(z.object({
            clientId: z.number().optional()
        }))
        .query(async () => {
            try {
                const data = await adversaryService.fetchMitreAttackData();
                return {
                    tactics: data.tactics,
                    techniques: data.techniques,
                    mitigations: data.mitigations,
                    lastUpdated: data.lastUpdated
                };
            } catch (error: any) {
                console.error("Failed to fetch MITRE data:", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch MITRE data",
                    cause: error
                });
            }
        }),

    // Search MITRE Techniques
    searchTechniques: clientProcedure
        .input(z.object({
            query: z.string(),
            limit: z.number().optional().default(20),
            clientId: z.number().optional()
        }))
        .query(async ({ input }: any) => {
            const results = await adversaryService.searchMitreTechniques(input.query, input.limit);
            return results;
        }),

    // Get Intelligence Summary for Dashboard
    getSummary: clientProcedure
        .input(z.object({
            clientId: z.number().optional()
        }).optional())
        .query(async () => {
            const summary = await adversaryService.getIntelligenceSummary();
            return summary;
        })
});
