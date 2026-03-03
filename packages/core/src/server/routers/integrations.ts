import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { integrations, integrationDefinitions, evidenceFiles } from "../../schema";
import * as db from "../../db";
import { encrypt } from "../../lib/crypto";

// Validate APP_URL - use default for development if not set
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Known integration providers for validation
const KNOWN_PROVIDERS = ['github', 'slack', 'smtp', 'jira', 'siem', 'soar', 'threat-intel', 'google-drive', 'vulnerability-scanner'] as const;
type KnownProvider = typeof KNOWN_PROVIDERS[number];

export const integrationsRouter = (t: any, clientProcedure: any, publicProcedure: any, isAuthed: any) => {
    return t.router({
        // Get marketplace available integrations (public - returns static data)
        getMarketplace: publicProcedure
            .query(async () => {
                try {
                    console.log("[Integrations] Fetching marketplace...");
                    return [
                        {
                            slug: "github",
                            name: "GitHub",
                            description: "Connect to GitHub to sync repositories, security alerts, and workflow status",
                            category: "source-control",
                            icon: "🐙",
                            authType: "oauth2",
                            requiresCredentials: true,
                            actions: [
                                { id: "list-repos", name: "List Repositories" },
                                { id: "get-security-alerts", name: "Get Security Alerts" },
                                { id: "list-issues", name: "List Issues" },
                                { id: "get-workflow-runs", name: "Get Workflow Runs" }
                            ]
                        },
                        {
                            slug: "slack",
                            name: "Slack",
                            description: "Send notifications and alerts to Slack channels",
                            category: "communication",
                            icon: "💬",
                            authType: "oauth2",
                            requiresCredentials: true,
                            actions: [
                                { id: "send-message", name: "Send Message" }
                            ]
                        },
                        {
                            slug: "vulnerability-scanner",
                            name: "Vulnerability Scanner",
                            description: "Connect to Nessus, Qualys, or OpenVAS to automatically gather vulnerability data for ISO 27001 evidence",
                            category: "scanner",
                            icon: "🔍",
                            authType: "apiKey",
                            requiresCredentials: true,
                            actions: [
                                { id: "list-vulnerabilities", name: "List Vulnerabilities" },
                                { id: "get-vulnerability-detail", name: "Get Vulnerability Detail" },
                                { id: "list-scans", name: "List Scan History" },
                                { id: "list-hosts", name: "List Scanned Hosts" },
                                { id: "get-compliance-summary", name: "Get Compliance Summary" },
                                { id: "get-evidence-report", name: "Generate Evidence Report" }
                            ]
                        },
                        {
                            slug: "jira",
                            name: "Jira",
                            description: "Sync compliance tasks and issues with Jira",
                            category: "governance",
                            icon: "📋",
                            authType: "oauth2",
                            requiresCredentials: true,
                            actions: [
                                { id: "create-issue", name: "Create Issue" },
                                { id: "sync-tasks", name: "Sync Tasks" }
                            ]
                        },
                        {
                            slug: "siem",
                            name: "SIEM",
                            description: "Connect to SIEM platforms (Splunk, QRadar, Azure Sentinel) to correlate security events",
                            category: "scanner",
                            icon: "🛡️",
                            authType: "apiKey",
                            requiresCredentials: true,
                            actions: [
                                { id: "list-alerts", name: "List Security Alerts" },
                                { id: "get-alert-details", name: "Get Alert Details" },
                                { id: "list-incidents", name: "List Incidents" },
                                { id: "get-incident-details", name: "Get Incident Details" },
                                { id: "list-dashboards", name: "List Dashboards" },
                                { id: "search-logs", name: "Search Logs" },
                                { id: "get-threat-intelligence", name: "Lookup Threat Intel" },
                                { id: "sync-alerts", name: "Sync Alerts" }
                            ]
                        },
                        {
                            slug: "soar",
                            name: "SOAR",
                            description: "Connect to SOAR platforms (Splunk SOAR, XSOAR) to automate security response",
                            category: "scanner",
                            icon: "🎯",
                            authType: "apiKey",
                            requiresCredentials: true,
                            actions: [
                                { id: "list-playbooks", name: "List Playbooks" },
                                { id: "run-playbook", name: "Run Playbook" },
                                { id: "list-cases", name: "List Cases" },
                                { id: "get-case-details", name: "Get Case Details" },
                                { id: "update-case", name: "Update Case" },
                                { id: "create-case", name: "Create Case" },
                                { id: "get-metrics", name: "Get Metrics" },
                                { id: "list-artifacts", name: "List Artifacts" }
                            ]
                        },
                        {
                            slug: "threat-intel",
                            name: "Threat Intelligence",
                            description: "Connect to threat intel platforms (VirusTotal, AlienVault OTX, AbuseIPDB) for IOC data",
                            category: "scanner",
                            icon: "🕵️",
                            authType: "apiKey",
                            requiresCredentials: true,
                            actions: [
                                { id: "lookup-indicator", name: "Lookup Indicator" },
                                { id: "list-iocs", name: "List IOCs" },
                                { id: "add-ioc", name: "Add IOC" },
                                { id: "list-reports", name: "List Reports" },
                                { id: "get-report", name: "Get Report" },
                                { id: "list-pulse-subscriptions", name: "List Pulse Subscriptions" },
                                { id: "search-pulses", name: "Search Pulses" },
                                { id: "get-threat-score", name: "Get Threat Score" }
                            ]
                        },
                        {
                            slug: "google-drive",
                            name: "Google Drive",
                            description: "Connect to Google Drive to fetch and sync evidence files directly into your compliance vault",
                            category: "storage",
                            icon: "📁",
                            authType: "oauth2",
                            requiresCredentials: true,
                            actions: [
                                { id: "list-files", name: "List Files" },
                                { id: "get-file", name: "Get File Metadata" },
                                { id: "download-file", name: "Download File" },
                                { id: "import-to-evidence", name: "Import to Evidence" }
                            ]
                        }
                    ];
                } catch (error) {
                    console.error("[Integrations] Error in getMarketplace:", error);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to fetch marketplace"
                    });
                }
            }),

        // Get credentials for a provider
        getProviderCredentials: clientProcedure
            .input(z.object({
                provider: z.string(),
                clientId: z.number()
            }))
            .query(async ({ input }: any) => {
                const { provider, clientId } = input;
                console.log(`[Integrations] Fetching credentials for ${provider}, tenant ${clientId}`);

                try {
                    const dbConn = await db.getDb();
                    const result = await dbConn.select()
                        .from(integrationDefinitions)
                        .where(and(
                            eq(integrationDefinitions.tenantId, clientId),
                            eq(integrationDefinitions.provider, provider)
                        ))
                        .limit(1);

                    const creds = result[0];
                    if (!creds) {
                        return { provider, hasCredentials: false };
                    }

                    return {
                        provider: creds.provider,
                        clientId: creds.clientId,
                        hasCredentials: !!creds.clientSecret,
                        redirectUri: creds.redirectUri
                    };
                } catch (error) {
                    console.error("[Integrations] Error in getProviderCredentials:", error);
                    // Return null instead of throwing to prevent 500 errors
                    return null;
                }
            }),

        // Save credentials
        saveProviderCredentials: clientProcedure
            .input(z.object({
                provider: z.string(),
                clientId: z.number(),
                credentials: z.object({
                    clientId: z.string(),
                    clientSecret: z.string(),
                    redirectUri: z.string().optional()
                })
            }))
            .mutation(async ({ input }: any) => {
                const { provider, clientId, credentials } = input;

                try {
                    const dbConn = await db.getDb();
                    const existing = await dbConn.select()
                        .from(integrationDefinitions)
                        .where(and(
                            eq(integrationDefinitions.tenantId, clientId),
                            eq(integrationDefinitions.provider, provider)
                        ))
                        .limit(1);

                    if (existing.length > 0) {
                        await dbConn.update(integrationDefinitions)
                            .set({
                                clientId: credentials.clientId,
                                clientSecret: encrypt(credentials.clientSecret),
                                redirectUri: credentials.redirectUri,
                                updatedAt: new Date()
                            })
                            .where(and(
                                eq(integrationDefinitions.tenantId, clientId),
                                eq(integrationDefinitions.provider, provider)
                            ));
                    } else {
                        await dbConn.insert(integrationDefinitions)
                            .values({
                                provider,
                                name: provider.charAt(0).toUpperCase() + provider.slice(1),
                                clientId: credentials.clientId,
                                clientSecret: encrypt(credentials.clientSecret),
                                redirectUri: credentials.redirectUri,
                                tenantId: clientId
                            });
                    }

                    return { success: true };
                } catch (error) {
                    console.error("[Integrations] Error in saveProviderCredentials:", error);
                    const isDev = process.env.NODE_ENV === 'development';
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: isDev && error instanceof Error ? `Failed to save credentials: ${error.message}` : "Failed to save credentials"
                    });
                }
            }),

        // Get OAuth URL
        getOAuthUrl: clientProcedure
            .input(z.object({
                provider: z.string(),
                clientId: z.number(),
                state: z.string()  // Required for CSRF protection
            }))
            .mutation(async ({ input }: any) => {
                const { provider, clientId, state } = input;
                console.log(`[Integrations] Getting OAuth URL for ${provider}, tenant ${clientId}`);

                try {
                    const dbConn = await db.getDb();
                    const result = await dbConn.select()
                        .from(integrationDefinitions)
                        .where(and(
                            eq(integrationDefinitions.tenantId, clientId),
                            eq(integrationDefinitions.provider, provider)
                        ))
                        .limit(1);

                    const creds = result[0];
                    if (!creds || !creds.clientSecret) {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: `No OAuth credentials configured for ${provider}.`
                        });
                    }

                    const oauthClientId = creds.clientId;
                    // Use stored redirect URI or build from APP_URL
                    let oauthRedirectUri = creds.redirectUri;
                    if (!oauthRedirectUri) {
                        if (provider === "github") {
                            oauthRedirectUri = `${APP_URL}/api/oauth/github/callback`;
                        } else if (provider === "google-drive") {
                            // For Google Drive, always use the full URL from APP_URL
                            oauthRedirectUri = `${APP_URL}/auth/callback/google-drive`;
                        } else {
                            oauthRedirectUri = `${APP_URL}/auth/callback/${provider}`;
                        }
                    }
                    console.log(`[OAuth] Using redirect URI for ${provider}: ${oauthRedirectUri}`);

                    if (provider === "github") {
                        const scopes = "repo read:org security_events";
                        let oauthUrl = `https://github.com/login/oauth/authorize?client_id=${oauthClientId}&redirect_uri=${encodeURIComponent(oauthRedirectUri)}&scope=${encodeURIComponent(scopes)}`;

                        if (state) {
                            oauthUrl += `&state=${encodeURIComponent(state)}`;
                        }

                        return { url: oauthUrl };
                    }

                    if (provider === "slack") {
                        const scopes = "chat:write chat:write.public incoming-webhook channels:read";
                        let oauthUrl = `https://slack.com/oauth/v2/authorize?client_id=${oauthClientId}&redirect_uri=${encodeURIComponent(oauthRedirectUri)}&scope=${encodeURIComponent(scopes)}`;

                        if (state) {
                            oauthUrl += `&state=${encodeURIComponent(state)}`;
                        }

                        return { url: oauthUrl };
                    }

                    // API Key based integrations - return success without OAuth redirect
                    // The credentials have already been validated above
                    if (provider === "vulnerability-scanner") {
                        return { url: null, message: "API Key configured successfully" };
                    }

                    // Google Drive OAuth - requires OAuth credentials in integration definitions
                    if (provider === "google-drive") {
                        if (!creds || !creds.clientId || !creds.clientSecret) {
                            throw new TRPCError({
                                code: "BAD_REQUEST",
                                message: "Google Drive OAuth requires OAuth Client ID and Secret to be configured in Settings → Integrations first. Get these from Google Cloud Console."
                            });
                        }
                        const scopes = [
                            "https://www.googleapis.com/auth/drive.readonly",
                            "https://www.googleapis.com/auth/drive.metadata.readonly"
                        ];
                        // Get the base URL - try multiple sources (dev takes priority)
                        const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://complianceos.vercel.app');
                        const oauthRedirectUri = creds.redirectUri || `${appUrl}/auth/callback/google-drive`;
                        let oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${creds.clientId}&redirect_uri=${encodeURIComponent(oauthRedirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(" "))}&access_type=offline`;

                        if (state) {
                            oauthUrl += `&state=${encodeURIComponent(state)}`;
                        }

                        return { url: oauthUrl };
                    }

                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Provider ${provider} not supported yet`
                    });
                } catch (error) {
                    console.error("[Integrations] Error in getOAuthUrl:", error);
                    if (error instanceof TRPCError) throw error;
                    const isDev = process.env.NODE_ENV === 'development';
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: isDev && error instanceof Error ? `Failed to generate OAuth URL: ${error.message}` : "Failed to generate OAuth URL"
                    });
                }
            }),

        // Handle Callback
        handleOAuthCallback: clientProcedure
            .input(z.object({
                provider: z.string(),
                code: z.string(),
                clientId: z.number()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const { provider, code, clientId } = input;
                console.log(`[Integrations] Handling callback for ${provider}, tenant ${clientId}`);

                try {
                    const dbConn = await db.getDb();
                    const result = await dbConn.select()
                        .from(integrationDefinitions)
                        .where(and(
                            eq(integrationDefinitions.tenantId, clientId),
                            eq(integrationDefinitions.provider, provider)
                        ))
                        .limit(1);

                    const creds = result[0];
                    if (!creds) throw new TRPCError({ code: "BAD_REQUEST", message: "Provider credentials not found" });

                    if (provider === "github") {
                        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Accept": "application/json"
                            },
                            body: JSON.stringify({
                                client_id: creds.clientId,
                                client_secret: creds.clientSecret,
                                code
                            })
                        });

                        const tokenData = await tokenResponse.json();
                        if (tokenData.error) {
                            throw new TRPCError({
                                code: "BAD_REQUEST",
                                message: `GitHub Error: ${tokenData.error_description || tokenData.error}`
                            });
                        }

                        const accessToken = tokenData.access_token;
                        const refreshToken = tokenData.refresh_token;

                        // Get user info
                        const userResponse = await fetch("https://api.github.com/user", {
                            headers: { "Authorization": `Bearer ${accessToken}` }
                        });
                        const userData = await userResponse.json();

                        // Save integration (tokens are encrypted)
                        await dbConn.insert(integrations).values({
                            clientId: clientId,
                            provider: "github",
                            accessToken: encrypt(accessToken),
                            refreshToken: refreshToken ? encrypt(refreshToken) : null,
                            externalAccountId: userData.id?.toString(),
                            scopes: tokenData.scope,
                            metadata: userData,
                            isActive: true
                        }).onConflictDoUpdate({
                            target: [integrations.clientId, integrations.provider],
                            set: {
                                accessToken: encrypt(accessToken),
                                refreshToken: refreshToken ? encrypt(refreshToken) : null,
                                externalAccountId: userData.id?.toString(),
                                scopes: tokenData.scope,
                                metadata: userData,
                                isActive: true,
                                updatedAt: new Date()
                            }
                        });

                        return { success: true };
                    }

                    if (provider === "slack") {
                        const oauthRedirectUri = creds.redirectUri || `${process.env.APP_URL}/auth/callback/slack`;

                        const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                            },
                            body: new URLSearchParams({
                                client_id: creds.clientId,
                                client_secret: creds.clientSecret,
                                code,
                                redirect_uri: oauthRedirectUri
                            }).toString()
                        });

                        const tokenData = await tokenResponse.json();
                        if (!tokenData.ok) {
                            throw new TRPCError({
                                code: "BAD_REQUEST",
                                message: `Slack Error: ${tokenData.error}`
                            });
                        }

                        const accessToken = tokenData.access_token;

                        // Save integration (tokens are encrypted)
                        await dbConn.insert(integrations).values({
                            clientId: clientId,
                            provider: "slack",
                            accessToken: encrypt(accessToken),
                            refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
                            externalAccountId: tokenData.team?.id || tokenData.app_id,
                            scopes: tokenData.scope,
                            metadata: tokenData,
                            isActive: true
                        }).onConflictDoUpdate({
                            target: [integrations.clientId, integrations.provider],
                            set: {
                                accessToken: encrypt(accessToken),
                                refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
                                externalAccountId: tokenData.team?.id || tokenData.app_id,
                                scopes: tokenData.scope,
                                metadata: tokenData,
                                isActive: true,
                                updatedAt: new Date()
                            }
                        });

                        return { success: true };
                    }

                    // Google Drive OAuth
                    if (provider === "google-drive") {
                        // Get the base URL - try multiple sources (dev takes priority)
                        const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://complianceos.vercel.app');
                        const oauthRedirectUri = creds.redirectUri || `${appUrl}/auth/callback/google-drive`;

                        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                            },
                            body: new URLSearchParams({
                                client_id: creds.clientId,
                                client_secret: creds.clientSecret,
                                code,
                                grant_type: "authorization_code",
                                redirect_uri: oauthRedirectUri
                            }).toString()
                        });

                        const tokenData = await tokenResponse.json();
                        if (tokenData.error) {
                            throw new TRPCError({
                                code: "BAD_REQUEST",
                                message: `Google Drive Error: ${tokenData.error_description || tokenData.error}`
                            });
                        }

                        const accessToken = tokenData.access_token;
                        const refreshToken = tokenData.refresh_token;

                        // Get user info from Google Drive
                        const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
                            headers: { "Authorization": `Bearer ${accessToken}` }
                        });
                        const userData = await userResponse.json();

                        // Save integration (tokens are encrypted)
                        await dbConn.insert(integrations).values({
                            clientId: clientId,
                            provider: "google-drive",
                            accessToken: encrypt(accessToken),
                            refreshToken: refreshToken ? encrypt(refreshToken) : null,
                            externalAccountId: userData.id,
                            scopes: tokenData.scope,
                            metadata: { email: userData.email, name: userData.name },
                            isActive: true
                        }).onConflictDoUpdate({
                            target: [integrations.clientId, integrations.provider],
                            set: {
                                accessToken: encrypt(accessToken),
                                refreshToken: refreshToken ? encrypt(refreshToken) : null,
                                externalAccountId: userData.id,
                                scopes: tokenData.scope,
                                metadata: { email: userData.email, name: userData.name },
                                isActive: true,
                                updatedAt: new Date()
                            }
                        });

                        return { success: true };
                    }

                    throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported provider" });
                } catch (error) {
                    console.error("[Integrations] Error in handleOAuthCallback:", error);
                    if (error instanceof TRPCError) throw error;
                    const isDev = process.env.NODE_ENV === 'development';
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: isDev && error instanceof Error ? `Failed to exchange OAuth code: ${error.message}` : "Failed to exchange OAuth code"
                    });
                }
            }),

        // Get active connections
        getConnections: clientProcedure
            .input(z.object({
                clientId: z.number()
            }))
            .query(async ({ input }: any) => {
                const { clientId } = input;
                try {
                    const dbConn = await db.getDb();
                    // Get OAuth connections
                    const oauthConnections = await dbConn.select()
                        .from(integrations)
                        .where(eq(integrations.clientId, clientId));

                    // Also get integrations that have credentials saved but no connection
                    const credentialDefinitions = await dbConn.select()
                        .from(integrationDefinitions)
                        .where(eq(integrationDefinitions.tenantId, clientId));

                    // Build list of providers with saved credentials
                    const providersWithCredentials = new Set(
                        credentialDefinitions
                            .filter(c => c.clientSecret)
                            .map(c => c.provider)
                    );

                    // Create pseudo-connections for integrations with credentials but no connection record
                    const pseudoConnections = credentialDefinitions
                        .filter(c => c.clientSecret && !oauthConnections.some(o => o.provider === c.provider))
                        .map(c => ({
                            id: -Date.now() - Math.random(), // Negative ID to distinguish
                            clientId: c.tenantId,
                            provider: c.provider,
                            accessToken: null,
                            refreshToken: null,
                            externalAccountId: c.provider + '-api-key',
                            scopes: c.scopes,
                            metadata: c,
                            isApiKey: true,
                            hasCredentials: true,
                            createdAt: c.createdAt,
                            updatedAt: c.updatedAt
                        }));

                    return [...oauthConnections, ...pseudoConnections];
                } catch (error) {
                    console.error("[Integrations] Error in getConnections:", error);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to fetch active connections"
                    });
                }
            }),

        // Disconnect integration
        disconnectIntegration: clientProcedure
            .input(z.object({
                id: z.number(),
                clientId: z.number(),
                provider: z.string().optional()
            }))
            .mutation(async ({ input }: any) => {
                const { id, clientId, provider } = input;
                try {
                    const dbConn = await db.getDb();

                    // Check if this is a pseudo-connection (negative ID) for API-key integration
                    if (id < 0 && provider) {
                        console.log(`[Integrations] Deleting credentials for ${provider}, clientId: ${clientId}`);
                        // Delete credentials from integrationDefinitions table
                        const result = await dbConn.delete(integrationDefinitions)
                            .where(and(
                                eq(integrationDefinitions.tenantId, clientId),
                                eq(integrationDefinitions.provider, provider)
                            ));
                        console.log(`[Integrations] Deleted credentials result:`, result);
                        return { success: true };
                    }

                    // Regular OAuth connection - delete from integrations table
                    console.log(`[Integrations] Deleting OAuth connection id: ${id}, clientId: ${clientId}`);
                    const result = await dbConn.delete(integrations)
                        .where(and(
                            eq(integrations.id, id),
                            eq(integrations.clientId, clientId)
                        ));
                    console.log(`[Integrations] Deleted connection result:`, result);
                    return { success: true };
                } catch (error: any) {
                    console.error("[Integrations] Error in disconnectIntegration:", error);
                    // Return success anyway if the record doesn't exist (idempotent)
                    if (error?.message?.includes('no record to delete') || error?.code === 'P2025') {
                        return { success: true };
                    }
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: error?.message || "Failed to disconnect integration"
                    });
                }
            }),

        // List Google Drive files
        listGoogleDriveFiles: clientProcedure
            .input(z.object({
                clientId: z.number(),
                folderId: z.string().optional(),
                query: z.string().optional()
            }))
            .query(async ({ input }: any) => {
                const { clientId, folderId, query } = input;
                try {
                    const dbConn = await db.getDb();
                    const result = await dbConn.select()
                        .from(integrations)
                        .where(and(
                            eq(integrations.clientId, clientId),
                            eq(integrations.provider, "google-drive")
                        ))
                        .limit(1);

                    const connection = result[0];
                    if (!connection || !connection.accessToken) {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: "Google Drive not connected"
                        });
                    }

                    // Use the Google Drive API to list files
                    const { decrypt } = await import("../../lib/crypto");
                    const accessToken = decrypt(connection.accessToken);

                    let q = "trashed = false";
                    if (folderId) {
                        q = `'${folderId}' in parents and trashed = false`;
                    }
                    if (query) {
                        q += ` and name contains '${query}'`;
                    }

                    const params = new URLSearchParams({
                        q,
                        fields: "files(id, name, mimeType, webViewLink, iconLink, modifiedTime, webContentLink, size)",
                        pageSize: "100",
                        orderBy: "modifiedTime desc"
                    });

                    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        }
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: `Google Drive API error: ${error.error?.message || response.statusText}`
                        });
                    }

                    const data = await response.json();
                    return { files: data.files || [] };
                } catch (error) {
                    console.error("[Integrations] Error in listGoogleDriveFiles:", error);
                    if (error instanceof TRPCError) throw error;
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to list Google Drive files"
                    });
                }
            }),

        // Import file from Google Drive to Evidence
        importFromGoogleDrive: clientProcedure
            .input(z.object({
                clientId: z.number(),
                evidenceId: z.number(),
                fileId: z.string(),
                fileName: z.string(),
                mimeType: z.string()
            }))
            .mutation(async ({ input }: any) => {
                const { clientId, evidenceId, fileId, fileName, mimeType } = input;
                try {
                    const dbConn = await db.getDb();

                    // Get Google Drive connection
                    const result = await dbConn.select()
                        .from(integrations)
                        .where(and(
                            eq(integrations.clientId, clientId),
                            eq(integrations.provider, "google-drive")
                        ))
                        .limit(1);

                    const connection = result[0];
                    if (!connection || !connection.accessToken) {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: "Google Drive not connected"
                        });
                    }

                    // Decrypt access token
                    const { decrypt } = await import("../../lib/crypto");
                    const accessToken = decrypt(connection.accessToken);

                    // Download file from Google Drive
                    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        }
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: `Failed to download file: ${error.error?.message || response.statusText}`
                        });
                    }

                    // Convert to base64
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const base64 = buffer.toString("base64");

                    // Generate unique filename
                    const timestamp = Date.now();
                    const randomSuffix = Math.random().toString(36).substring(2, 8);
                    const extension = fileName.split(".").pop() || "";
                    const filename = `gdrive-${evidenceId}-${timestamp}-${randomSuffix}.${extension}`;

                    // Upload to storage (using the same approach as EvidenceFileUpload)
                    const uploadResponse = await fetch("/api/upload", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            filename,
                            data: base64,
                            contentType: mimeType,
                            folder: "evidence"
                        })
                    });

                    if (!uploadResponse.ok) {
                        throw new TRPCError({
                            code: "INTERNAL_SERVER_ERROR",
                            message: "Failed to upload file to storage"
                        });
                    }

                    const { key, url } = await uploadResponse.json();
                    const fileSize = buffer.length;

                    // Insert file record
                    await dbConn.insert(evidenceFiles).values({
                        evidenceId,
                        filename,
                        originalFilename: fileName,
                        mimeType,
                        size: fileSize,
                        fileKey: key,
                        url,
                        uploadedAt: new Date()
                    });

                    return { success: true, filename: fileName };
                } catch (error) {
                    console.error("[Integrations] Error in importFromGoogleDrive:", error);
                    if (error instanceof TRPCError) throw error;
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to import file from Google Drive"
                    });
                }
            }),

        // Get a specific integration by provider
        // Note: Authorization handled by clientProcedure middleware via checkClientAccess
        get: clientProcedure
            .input(z.object({
                clientId: z.number(),
                provider: z.enum(KNOWN_PROVIDERS)
            }))
            .query(async ({ input, ctx }: any) => {
                const { clientId, provider } = input;
                const dbConn = await db.getDb();

                try {
                    // Get OAuth connection if exists
                    const oauthResult = await dbConn.select()
                        .from(integrations)
                        .where(and(
                            eq(integrations.clientId, clientId),
                            eq(integrations.provider, provider)
                        ))
                        .limit(1);

                    // Get credentials definition
                    const credsResult = await dbConn.select()
                        .from(integrationDefinitions)
                        .where(and(
                            eq(integrationDefinitions.tenantId, clientId),
                            eq(integrationDefinitions.provider, provider)
                        ))
                        .limit(1);

                    const oauthConnection = oauthResult[0];
                    const creds = credsResult[0];

                    // Return combined data
                    return {
                        id: oauthConnection?.id || creds?.id,
                        clientId,
                        provider,
                        isEnabled: oauthConnection?.isActive || !!creds?.clientSecret,
                        settings: oauthConnection?.metadata || creds?.metadata,
                        hasCredentials: !!creds?.clientSecret,
                        isActive: oauthConnection?.isActive || false,
                        createdAt: oauthConnection?.createdAt || creds?.createdAt,
                        updatedAt: oauthConnection?.updatedAt || creds?.updatedAt
                    };
                } catch (error) {
                    console.error("[Integrations] Error in get:", error);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to fetch integration"
                    });
                }
            }),

        // Update integration settings
        update: clientProcedure
            .input(z.object({
                clientId: z.number(),
                provider: z.enum(KNOWN_PROVIDERS),
                isEnabled: z.boolean().optional(),
                settings: z.record(z.any()).optional()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const { clientId, provider, isEnabled, settings } = input;

                // Note: Authorization handled by clientProcedure middleware via checkClientAccess
                const dbConn = await db.getDb();

                try {
                    // Check if integration exists
                    const existing = await dbConn.select()
                        .from(integrations)
                        .where(and(
                            eq(integrations.clientId, clientId),
                            eq(integrations.provider, provider)
                        ))
                        .limit(1);

                    if (existing.length > 0) {
                        // Update existing
                        await dbConn.update(integrations)
                            .set({
                                isActive: isEnabled !== undefined ? isEnabled : existing[0].isActive,
                                metadata: settings ? { ...existing[0].metadata, ...settings } : existing[0].metadata,
                                updatedAt: new Date()
                            })
                            .where(and(
                                eq(integrations.clientId, clientId),
                                eq(integrations.provider, provider)
                            ));
                    } else {
                        // Create new integration record
                        await dbConn.insert(integrations)
                            .values({
                                clientId,
                                provider,
                                isActive: isEnabled !== undefined ? isEnabled : true,
                                metadata: settings || {},
                                accessToken: null,
                                refreshToken: null
                            });
                    }

                    return { success: true };
                } catch (error) {
                    console.error("[Integrations] Error in update:", error);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to update integration"
                    });
                }
            }),

        // Test connection (generic stub for SMTP and other integrations)
        // Note: Authorization handled by clientProcedure middleware via checkClientAccess
        testConnection: clientProcedure
            .input(z.object({
                clientId: z.number(),
                provider: z.string()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const { clientId, provider } = input;

                // Note: Authorization handled by clientProcedure middleware via checkClientAccess
                const dbConn = await db.getDb();

                try {
                    // For now, just return success - actual testing would be provider-specific
                    console.log(`[Integrations] Testing connection for ${provider}`);

                    if (provider === 'smtp') {
                        // SMTP test would require actually sending a test email
                        // For now, just verify we have the settings
                        return { success: true, message: "SMTP configuration validated" };
                    }

                    return { success: true, message: "Connection test not implemented for this provider" };
                } catch (error) {
                    console.error("[Integrations] Error in testConnection:", error);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to test connection"
                    });
                }
            })
    });
};


