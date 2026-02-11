import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { PluginLoader, PluginPackageSchema } from "../lib/pluginParser";
import fs from "fs";
import path from "path";

// Helper to read registry locally for now
// In production, this would fetch from a URL
const REGISTRY_PATH = path.resolve(process.cwd(), "data/registry/index.json");
const PLUGINS_DIR = path.resolve(process.cwd(), "data/registry/plugins");

export const createFrameworkPluginsRouter = (t: any, protectedProcedure: any) => {
    return t.router({

        // 1. List available plugins from the Registry
        listRegistry: protectedProcedure
            .query(async () => {
                try {
                    if (!fs.existsSync(REGISTRY_PATH)) {
                        return { plugins: [] };
                    }
                    const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
                    const registry = JSON.parse(content);
                    return registry;
                } catch (error: any) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: `Failed to load registry: ${error.message}`
                    });
                }
            }),

        // 2. Install a plugin from the Registry (by ID)
        installPlugin: protectedProcedure
            .input(z.object({
                pluginId: z.string(),
            }))
            .mutation(async ({ input }: any) => {
                try {
                    // In a real app, we'd fetch the JSON from a URL here.
                    // For now, we look for a matching file in data/registry/plugins/ matching the slug/id? 
                    // Let's assume the registry index maps ID -> Filename, or we search.
                    // For this MVP, let's look for known files.

                    // Re-read registry to find the slug/filename
                    const regContent = fs.readFileSync(REGISTRY_PATH, 'utf-8');
                    const registry = JSON.parse(regContent);
                    const pluginEntry = registry.plugins.find((p: any) => p.id === input.pluginId);

                    if (!pluginEntry) {
                        throw new TRPCError({ code: "NOT_FOUND", message: "Plugin not found in registry" });
                    }

                    // Assume filename matches slug.toLowerCase() + .json
                    const filename = `${pluginEntry.slug.toLowerCase()}.json`;
                    const filePath = path.join(PLUGINS_DIR, filename);

                    if (!fs.existsSync(filePath)) {
                        throw new TRPCError({ code: "NOT_FOUND", message: `Plugin file not found locally: ${filename}` });
                    }

                    const fileContent = fs.readFileSync(filePath, 'utf-8');
                    const pluginPackage = JSON.parse(fileContent);

                    // Validate & Install
                    const validated = PluginLoader.validate(pluginPackage);
                    const result = await PluginLoader.install(validated);

                    return { success: true, ...result };

                } catch (error: any) {
                    console.error("Install failed:", error);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: `Installation failed: ${error.message}`
                    });
                }
            }),

        // 3. Upload and Install a custom Plugin (Air-gapped / Dev mode)
        uploadPlugin: protectedProcedure
            .input(z.object({
                fileContent: z.string() // JSON string
            }))
            .mutation(async ({ input }: any) => {
                try {
                    const json = JSON.parse(input.fileContent);
                    const validated = PluginLoader.validate(json);
                    const result = await PluginLoader.install(validated);
                    return { success: true, ...result };
                } catch (error: any) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Invalid plugin file: ${error.message}`
                    });
                }
            })
    });
};
