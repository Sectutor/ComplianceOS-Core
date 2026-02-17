/**
 * Gumroad tRPC Router for License Management
 * 
 * Integrates Gumroad license validation with the existing tRPC API
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getGumroadClient } from "../../lib/gumroad";
import { getEnhancedLicenseValidator } from "../../lib/gumroad/license-validator";
import { config } from "../../lib/config";
import { licenseDbService } from "../../lib/license/licenseDbService";
import * as db from "../../db";
import { clients } from "../../schema";
import { eq } from "drizzle-orm";

export const createGumroadRouter = (t: any, clientProcedure: any, isAuthed: any, publicProcedure: any) => {
  return t.router({
    /**
     * Validate a Gumroad license key
     */
    validateLicense: publicProcedure
      .input(z.object({
        licenseKey: z.string().min(1, "License key is required"),
        productPermalink: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const validator = getEnhancedLicenseValidator();
          const licenseInfo = await validator.validateLicense(input.licenseKey);

          return {
            success: true,
            license: licenseInfo,
            message: "License validated successfully"
          };
        } catch (error) {
          console.error("License validation error:", error);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error instanceof Error ? error.message : 'Failed to validate license'
          });
        }
      }),

    /**
     * Get Gumroad products (admin only)
     */
    getProducts: publicProcedure
      .use(isAuthed)
      .input(z.object({
        limit: z.number().optional().default(10),
        offset: z.number().optional().default(0),
      }))
      .query(async ({ input, ctx }: any) => {
        // Check if user is admin
        if (!ctx.user?.isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required'
          });
        }

        try {
          const gumroad = getGumroadClient({
            accessToken: config.gumroad?.accessToken || '',
          });

          const products = await gumroad.listProducts();
          return {
            success: true,
            products: products.slice(input.offset, input.offset + input.limit),
            total: products.length
          };
        } catch (error) {
          console.error("Failed to fetch Gumroad products:", error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch Gumroad products'
          });
        }
      }),



    /**
     * Get Gumroad configuration status (admin only)
     */
    getGumroadConfig: publicProcedure
      .use(isAuthed)
      .query(async ({ ctx }: any) => {
        // Check if user is admin
        if (!ctx.user?.isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required'
          });
        }

        const isConfigured = !!config.gumroad?.accessToken;
        const validator = getEnhancedLicenseValidator();

        return {
          success: true,
          isConfigured,
          isGumroadEnabled: validator.isGumroadEnabled(),
          hasAccessToken: !!config.gumroad?.accessToken,
          hasWebhookSecret: !!config.gumroad?.webhookSecret,
          productPermalink: config.gumroad?.productPermalink || 'complianceos-enterprise',
          message: isConfigured ? 'Gumroad is configured' : 'Gumroad is not configured'
        };
      }),

    /**
     * Test Gumroad connection (admin only)
     */
    testGumroadConnection: publicProcedure
      .use(isAuthed)
      .mutation(async ({ ctx }: any) => {
        // Check if user is admin
        if (!ctx.user?.isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required'
          });
        }

        try {
          const gumroad = getGumroadClient({
            accessToken: config.gumroad?.accessToken || '',
          });

          // Try to fetch products to test connection
          const products = await gumroad.listProducts();

          return {
            success: true,
            connected: true,
            productCount: products.length,
            message: `Successfully connected to Gumroad. Found ${products.length} products.`
          };
        } catch (error) {
          console.error("Gumroad connection test failed:", error);
          return {
            success: false,
            connected: false,
            productCount: 0,
            message: error instanceof Error ? error.message : 'Failed to connect to Gumroad'
          };
        }
      }),

    /**
     * Get license status for a client
     */
    getLicenseStatus: clientProcedure
      .input(z.object({
        clientId: z.number(),
      }))
      .query(async ({ input }: any) => {
        try {
          // Get active license from database
          const activeLicense = await licenseDbService.getActiveLicenseForClient(input.clientId);

          if (!activeLicense) {
            // Check if this is a community build
            const isPremiumBuild = process.env.VITE_ENABLE_PREMIUM === 'true';

            if (!isPremiumBuild) {
              return {
                status: 'community',
                type: 'community',
                message: 'Using community edition (no license required)',
                features: [],
              };
            }

            return {
              status: 'inactive',
              type: 'none',
              message: 'No active license found',
              features: [],
            };
          }

          // Validate license with Gumroad to ensure it's still valid
          try {
            const validator = getEnhancedLicenseValidator();
            const licenseInfo = await validator.validateLicense(activeLicense.licenseKey);

            // Update license status if needed
            if (licenseInfo.status !== activeLicense.licenseStatus) {
              await licenseDbService.updateLicenseActivation(activeLicense.id, {
                licenseStatus: licenseInfo.status,
                lastValidatedAt: new Date(),
                validationCount: (activeLicense.validationCount || 0) + 1,
                lastValidationResult: licenseInfo,
              });
            }

            // Log the validation
            await licenseDbService.createValidationLog({
              licenseActivationId: activeLicense.id,
              licenseKey: activeLicense.licenseKey,
              clientId: input.clientId,
              isValid: licenseInfo.status === 'valid' || licenseInfo.status === 'active' || (licenseInfo.status as string) === 'valid',
              validationResult: licenseInfo,
              validationType: 'status_check',
            });

            return {
              status: licenseInfo.status,
              type: activeLicense.licenseType,
              licenseKey: activeLicense.licenseKey.substring(0, 8) + '...',
              issuedTo: activeLicense.customerName || licenseInfo.issuedTo,
              email: activeLicense.customerEmail || (licenseInfo.metadata as any)?.gumroad?.email || licenseInfo.issuedTo,
              productName: activeLicense.productName || (licenseInfo.metadata as any)?.gumroad?.productName || 'ComplianceOS',
              activatedAt: activeLicense.activatedAt?.toISOString(),
              expiresAt: activeLicense.expiresAt?.toISOString(),
              maxUsers: activeLicense.maxUsers,
              maxClients: activeLicense.maxClients,
              features: activeLicense.enabledFeatures as string[] || licenseInfo.features,
              message: `License is ${licenseInfo.status}`,
            };
          } catch (validationError) {
            // Gumroad validation failed, use database data
            console.warn("Gumroad validation failed, using cached license data:", validationError);

            return {
              status: activeLicense.licenseStatus,
              type: activeLicense.licenseType,
              licenseKey: activeLicense.licenseKey.substring(0, 8) + '...',
              issuedTo: activeLicense.customerName || 'Unknown',
              email: activeLicense.customerEmail || 'Unknown',
              productName: activeLicense.productName || 'ComplianceOS',
              activatedAt: activeLicense.activatedAt?.toISOString(),
              expiresAt: activeLicense.expiresAt?.toISOString(),
              maxUsers: activeLicense.maxUsers,
              maxClients: activeLicense.maxClients,
              features: activeLicense.enabledFeatures as string[] || [],
              message: `License status: ${activeLicense.licenseStatus} (cached)`,
            };
          }
        } catch (error) {
          console.error("Failed to get license status:", error);
          return {
            status: 'error',
            type: 'unknown',
            message: error instanceof Error ? error.message : 'Failed to get license status',
            features: [],
          };
        }
      }),

    /**
     * Activate license for a client
     */
    activateLicense: clientProcedure
      .input(z.object({
        clientId: z.number(),
        licenseKey: z.string().min(1, "License key is required"),
        productPermalink: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }: any) => {
        try {
          // Check if license is already active
          const isAlreadyActive = await licenseDbService.isLicenseKeyActive(input.licenseKey);
          if (isAlreadyActive) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'This license key is already active on another client'
            });
          }

          // Validate with Gumroad
          const validator = getEnhancedLicenseValidator();
          const licenseInfo = await validator.validateLicense(input.licenseKey);

          // Check if client already has an active license
          const existingActiveLicense = await licenseDbService.getActiveLicenseForClient(input.clientId);
          if (existingActiveLicense) {
            // Deactivate existing license
            await licenseDbService.deactivateLicense(existingActiveLicense.id);
          }

          const gumroadMetadata = (licenseInfo.metadata as any)?.gumroad || {};

          // Create license activation in database
          const activation = await licenseDbService.createLicenseActivation({
            licenseKey: input.licenseKey,
            licenseType: licenseInfo.type || 'enterprise',
            licenseStatus: 'active',
            productId: gumroadMetadata.productId,
            productPermalink: input.productPermalink || gumroadMetadata.productPermalink,
            productName: gumroadMetadata.productName,
            customerEmail: licenseInfo.issuedTo, // Using issuedTo as email for Gumroad
            customerName: licenseInfo.issuedTo,
            clientId: input.clientId,
            userId: ctx.user?.id,
            activationIp: ctx.req?.ip,
            maxUsers: licenseInfo.maxUsers || 10,
            maxClients: licenseInfo.maxClients || 5,
            maxFeatures: licenseInfo.features?.length || 0,
            issuedAt: new Date(licenseInfo.issuedAt || new Date()),
            activatedAt: new Date(),
            expiresAt: licenseInfo.expiresAt ? new Date(licenseInfo.expiresAt) : undefined,
            isRecurring: gumroadMetadata.isRecurring || false,
            recurrencePeriod: gumroadMetadata.recurrencePeriod,
            enabledFeatures: licenseInfo.features || [],
            metadata: {
              validatedAt: new Date().toISOString(),
              validationSource: 'gumroad_api',
              productPermalink: input.productPermalink,
            },
            gumroadValidationData: licenseInfo,
            lastValidatedAt: new Date(),
            validationCount: 1,
            lastValidationResult: licenseInfo,
          });

          // Log the activation validation
          await licenseDbService.createValidationLog({
            licenseActivationId: activation.id,
            licenseKey: input.licenseKey,
            clientId: input.clientId,
            userId: ctx.user?.id,
            requestIp: ctx.req?.ip,
            userAgent: ctx.req?.headers ? ctx.req.headers['user-agent'] : undefined,
            isValid: true,
            validationResult: licenseInfo,
            validationType: 'activation',
            validationDurationMs: 0,
          });

          // Track initial feature usage for enabled features
          for (const feature of licenseInfo.features || []) {
            await licenseDbService.trackFeatureUsage({
              licenseActivationId: activation.id,
              clientId: input.clientId,
              userId: ctx.user?.id,
              featureId: feature,
              featureName: feature,
              usageContext: { activation: true },
            });
          }

          // CRITICAL FIX: Update Client Plan Tier
          // The license is active, but we must update the client's tier in the main table
          // so the rest of the app knows they are Premium/Enterprise.
          const dbConn = await db.getDb();

          // Map license type to DB plan tier
          let targetTier = 'enterprise';
          const typeStr = String(licenseInfo.type); // Cast to string to avoid TS errors with enum mismatch

          if (typeStr === 'community') targetTier = 'free';
          else if (typeStr === 'trial') targetTier = 'pro';
          else if (typeStr === 'startup') targetTier = 'startup';
          else if (typeStr === 'pro') targetTier = 'pro';
          // else default to enterprise

          console.log(`[License] Upgrading client ${input.clientId} to ${targetTier} (License: ${input.licenseKey.substring(0, 8)}...)`);

          await dbConn.update(clients)
            .set({
              planTier: targetTier,
              subscriptionStatus: 'active',
              subscriptionEndDate: licenseInfo.expiresAt ? new Date(licenseInfo.expiresAt) : null,
              updatedAt: new Date()
            })
            .where(eq(clients.id, input.clientId));

          return {
            success: true,
            license: {
              ...licenseInfo,
              activationId: `act_${activation.id}`,
              activatedAt: activation.activatedAt?.toISOString(),
            },
            message: "License activated successfully",
            activationId: `act_${activation.id}`,
            activatedAt: activation.activatedAt?.toISOString(),
          };
        } catch (error) {
          console.error("License activation error:", error);

          // Log failed activation attempt
          if (input.licenseKey) {
            try {
              await licenseDbService.createValidationLog({
                licenseKey: input.licenseKey,
                clientId: input.clientId,
                requestIp: ctx.req?.ip,
                userAgent: ctx.req?.headers ? ctx.req.headers['user-agent'] : undefined,
                isValid: false,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                validationType: 'activation',
              });
            } catch (logError) {
              console.error("Failed to log activation error:", logError);
            }
          }

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error instanceof Error ? error.message : 'Failed to activate license'
          });
        }
      }),

    /**
     * Deactivate license for a client
     */
    deactivateLicense: clientProcedure
      .input(z.object({
        clientId: z.number(),
        licenseKey: z.string().min(1, "License key is required"),
      }))
      .mutation(async ({ input, ctx }: any) => {
        try {
          // Get the active license for this client
          const activeLicense = await licenseDbService.getActiveLicenseForClient(input.clientId);

          if (!activeLicense) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'No active license found for this client'
            });
          }

          // Verify the license key matches
          if (activeLicense.licenseKey !== input.licenseKey) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'License key does not match the active license for this client'
            });
          }

          // Deactivate the license
          const deactivated = await licenseDbService.deactivateLicense(activeLicense.id);

          if (!deactivated) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to deactivate license'
            });
          }


          // CRITICAL FIX: Downgrade Client Plan Tier
          // When a license is deactivated, we must revert the client to the free tier
          // to prevent unauthorized access to premium features.
          const dbConn = await db.getDb();
          console.log(`[License] Downgrading client ${input.clientId} to free (License Deactivated)`);

          await dbConn.update(clients)
            .set({
              planTier: 'free',
              subscriptionStatus: 'canceled',
              subscriptionEndDate: new Date(),
              updatedAt: new Date()
            })
            .where(eq(clients.id, input.clientId));

          // Log the deactivation
          await licenseDbService.createValidationLog({
            licenseActivationId: activeLicense.id,
            licenseKey: input.licenseKey,
            clientId: input.clientId,
            userId: ctx.user?.id,
            requestIp: ctx.req?.ip,
            userAgent: ctx.req?.headers ? ctx.req.headers['user-agent'] : undefined,
            isValid: false,
            validationResult: { action: 'deactivated', deactivatedAt: new Date().toISOString() },
            validationType: 'deactivation',
          });

          return {
            success: true,
            message: "License deactivated successfully",
            deactivatedAt: deactivated.deletedAt?.toISOString() || new Date().toISOString(),
            licenseKey: input.licenseKey.substring(0, 8) + '...',
          };
        } catch (error) {
          console.error("License deactivation error:", error);

          // Log failed deactivation attempt
          try {
            await licenseDbService.createValidationLog({
              licenseKey: input.licenseKey,
              clientId: input.clientId,
              requestIp: ctx.req?.ip,
              userAgent: ctx.req?.headers ? ctx.req.headers['user-agent'] : undefined,
              isValid: false,
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              validationType: 'deactivation',
            });
          } catch (logError) {
            console.error("Failed to log deactivation error:", logError);
          }

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error instanceof Error ? error.message : 'Failed to deactivate license'
          });
        }
      }),

    /**
     * Get analytics for licenses
     */
    getLicenseAnalytics: publicProcedure
      .use(isAuthed)
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input, ctx }: any) => {
        // Check if user is admin
        if (!ctx.user?.isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required'
          });
        }

        try {
          return await licenseDbService.getLicenseAnalytics({
            startDate: input.startDate,
            endDate: input.endDate,
          });
        } catch (error) {
          console.error("Failed to fetch license analytics:", error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch license analytics'
          });
        }
      }),

    /**
     * Get license usage statistics for a client
     */
    getLicenseUsageStats: clientProcedure
      .input(z.object({
        clientId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        try {
          const startDate = input.startDate ? new Date(input.startDate) : undefined;
          const endDate = input.endDate ? new Date(input.endDate) : undefined;

          const stats = await licenseDbService.getFeatureUsageStatistics({
            clientId: input.clientId,
            startDate,
            endDate,
          });

          return {
            success: true,
            stats,
            message: "License usage statistics retrieved successfully",
          };
        } catch (error) {
          console.error("Failed to get license usage stats:", error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to get license usage statistics'
          });
        }
      }),

    /**
     * Get expiring licenses (for renewal reminders)
     */
    getExpiringLicenses: publicProcedure
      .use(isAuthed)
      .input(z.object({
        days: z.number().optional().default(30),
      }))
      .query(async ({ input }) => {
        try {
          const expiringLicenses = await licenseDbService.getExpiringLicenses(input.days);

          return {
            success: true,
            licenses: expiringLicenses,
            count: expiringLicenses.length,
            message: `Found ${expiringLicenses.length} licenses expiring within ${input.days} days`,
          };
        } catch (error) {
          console.error("Failed to get expiring licenses:", error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to get expiring licenses'
          });
        }
      }),

    /**
     * Get expired licenses
     */
    getExpiredLicenses: publicProcedure
      .use(isAuthed)
      .query(async () => {
        try {
          const expiredLicenses = await licenseDbService.getExpiredLicenses();

          return {
            success: true,
            licenses: expiredLicenses,
            count: expiredLicenses.length,
            message: `Found ${expiredLicenses.length} expired licenses`,
          };
        } catch (error) {
          console.error("Failed to get expired licenses:", error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to get expired licenses'
          });
        }
      }),

    /**
     * Get validation logs for a license
     */
    getValidationLogs: clientProcedure
      .input(z.object({
        clientId: z.number(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
        days: z.number().optional(),
      }))
      .query(async ({ input }) => {
        try {
          const logs = await licenseDbService.getValidationLogsForClient(input.clientId, {
            limit: input.limit,
            offset: input.offset,
            days: input.days,
          });

          return {
            success: true,
            logs,
            count: logs.length,
            message: "Validation logs retrieved successfully",
          };
        } catch (error) {
          console.error("Failed to get validation logs:", error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to get validation logs'
          });
        }
      }),

    /**
     * Track feature usage (called from feature components)
     */
    trackFeatureUsage: clientProcedure
      .input(z.object({
        clientId: z.number(),
        featureId: z.string(),
        featureName: z.string().optional(),
        featureCategory: z.string().optional(),
        resourceId: z.string().optional(),
        usageContext: z.record(z.any()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Get active license for client
          const activeLicense = await licenseDbService.getActiveLicenseForClient(input.clientId);

          if (!activeLicense) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'No active license found for this client'
            });
          }

          // Check if feature is enabled for this license
          const enabledFeatures = activeLicense.enabledFeatures as string[] || [];
          if (!enabledFeatures.includes(input.featureId)) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: `Feature "${input.featureId}" is not enabled for this license`
            });
          }

          // Track feature usage
          const usage = await licenseDbService.trackFeatureUsage({
            licenseActivationId: activeLicense.id,
            clientId: input.clientId,
            userId: ctx.user?.id,
            featureId: input.featureId,
            featureName: input.featureName || input.featureId,
            featureCategory: input.featureCategory,
            resourceId: input.resourceId,
            usageContext: input.usageContext,
          });

          return {
            success: true,
            usage,
            message: "Feature usage tracked successfully",
          };
        } catch (error) {
          console.error("Failed to track feature usage:", error);

          // Don't throw error for tracking failures - just log and continue
          // This ensures feature usage doesn't break the main functionality
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to track feature usage',
          };
        }
      }),
  });
};