import { z } from "zod";
import * as db from "../../db";
import { clients, users } from "../../schema";
import { eq } from "drizzle-orm";
import { createCheckoutSession, createPortalSession } from "../../lib/stripe";
import { config } from "../../lib/config";
import { TRPCError } from "@trpc/server";

export const createBillingRouter = (t: any, clientProcedure: any, isAuthed: any, publicProcedure: any) => {
    return t.router({
        createCheckout: clientProcedure
            .input(z.object({
                clientId: z.number(),
                tier: z.enum(['startup', 'pro', 'guided', 'enterprise']),
                interval: z.enum(['month', 'year']).optional().default('month'), // Added interval
                successUrl: z.string(),
                cancelUrl: z.string(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const d = await db.getDb();
                const [client] = await d.select().from(clients).where(eq(clients.id, input.clientId));

                if (!client) throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });

                // Map tier to price ID
                let priceId;
                if (input.tier === 'startup') {
                    priceId = input.interval === 'year'
                        ? config.stripe.prices.startup.yearly
                        : config.stripe.prices.startup.monthly;
                } else if (input.tier === 'pro' || input.tier === 'guided') {
                    priceId = input.interval === 'year'
                        ? config.stripe.prices.guided.yearly
                        : config.stripe.prices.guided.monthly;
                } else {
                    priceId = config.stripe.prices.managed;
                }

                if (!priceId) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Stripe Price ID for tier ${input.tier} is not configured.`
                    });
                }

                try {
                    const session = await createCheckoutSession(
                        client.stripeCustomerId || undefined,
                        priceId,
                        input.successUrl,
                        input.cancelUrl,
                        {
                            clientId: String(input.clientId),
                            tier: input.tier,
                            customerEmail: ctx.user.email,
                            userId: String(ctx.user.id)
                        },
                        'subscription'
                    );
                    return { url: session.url };
                } catch (error: any) {
                    console.error('[Billing] Checkout Session Error:', error);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: error.message || 'Failed to create checkout session'
                    });
                }
            }),

        createUserCheckout: publicProcedure.use(isAuthed)
            .input(z.object({
                tier: z.enum(['startup', 'pro', 'guided', 'enterprise']),
                interval: z.enum(['month', 'year']).optional().default('month'), // Added interval
                successUrl: z.string(),
                cancelUrl: z.string(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                try {
                    console.log(`[Billing] Starting createUserCheckout for user ${ctx.user.id}, tier: ${input.tier}`);
                    console.log(`[Billing] Checking Stripe key availability: ${!!process.env.STRIPE_SECRET_KEY}`);

                    let priceId;
                    if (input.tier === 'startup') {
                        priceId = input.interval === 'year'
                            ? config.stripe.prices.startup.yearly
                            : config.stripe.prices.startup.monthly;
                    } else if (input.tier === 'pro' || input.tier === 'guided') {
                        priceId = input.interval === 'year'
                            ? config.stripe.prices.guided.yearly
                            : config.stripe.prices.guided.monthly;
                    } else {
                        priceId = config.stripe.prices.managed;
                    }

                    console.log(`[Billing] Resolved priceId: ${priceId}`);

                    if (!priceId) {
                        console.error(`[Billing] Missing price ID for tier ${input.tier}. Check your .env configuration.`);
                        console.error(`[Billing] Available Prices: `, {
                            startup_monthly: config.stripe.prices.startup.monthly,
                            startup_yearly: config.stripe.prices.startup.yearly,
                            guided_monthly: config.stripe.prices.guided.monthly,
                            guided_yearly: config.stripe.prices.guided.yearly,
                            managed: config.stripe.prices.managed
                        });
                        throw new TRPCError({
                            code: 'INTERNAL_SERVER_ERROR',
                            message: `Price configuration missing for tier ${input.tier}. Please contact support.`
                        });
                    }

                    // Update user to pending/incomplete status for the selected tier immediately
                    // Update user to pending/incomplete status for the selected tier immediately
                    console.log(`[Billing] Updating user ${ctx.user.id} status... (SKIPPED FOR DEBUGGING)`);
                    const d = await db.getDb();
                    // await d.update(users)
                    //     .set({
                    //         planTier: input.tier,
                    //         subscriptionStatus: 'incomplete', // Will be updated to 'active' by webhook on success
                    //         updatedAt: new Date()
                    //     })
                    //     .where(eq(users.id, ctx.user.id));

                    console.log(`[Billing] Creating Stripe Session...`);
                    const session = await createCheckoutSession(
                        ctx.user.stripeCustomerId || undefined,
                        priceId,
                        input.successUrl,
                        input.cancelUrl,
                        {
                            userId: String(ctx.user.id),
                            tier: input.tier,
                            customerEmail: ctx.user.email,
                            type: 'user'
                        },
                        'subscription'
                    );

                    console.log(`[Billing] Session created: ${session.id}`);
                    return { url: session.url };
                } catch (error: any) {
                    console.error('[Billing] CRITICAL ERROR in createUserCheckout:', error);
                    // Ensure we return a structured error that tRPC can handle, not a crash
                    if (error instanceof TRPCError) throw error;

                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Checkout failed: ${error.message || 'Unknown error'}`
                    });
                }
            }),

        createPortal: clientProcedure
            .input(z.object({
                clientId: z.number(),
                returnUrl: z.string(),
            }))
            .mutation(async ({ input }: any) => {
                const d = await db.getDb();
                const [client] = await d.select().from(clients).where(eq(clients.id, input.clientId));

                if (!client || !client.stripeCustomerId) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'No billing history found for this client.'
                    });
                }

                try {
                    const session = await createPortalSession(client.stripeCustomerId, input.returnUrl);
                    return { url: session.url };
                } catch (error: any) {
                    console.error('[Billing] Portal Session Error:', error);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: error.message || 'Failed to create portal session'
                    });
                }
            }),

        getBillingState: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const d = await db.getDb();
                const [client] = await d.select().from(clients).where(eq(clients.id, input.clientId));

                if (!client) throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });

                return {
                    planTier: client.planTier,
                    status: client.subscriptionStatus,
                    isEnabled: config.isBillingEnabled
                };
            }),

        syncSubscriptionStatus: publicProcedure.use(isAuthed)
            .mutation(async ({ ctx }: any) => {
                console.log(`[Billing] Syncing subscription status for user ${ctx.user.id}`);
                const d = await db.getDb();
                const user = await db.getUserById(ctx.user.id);

                if (!user || !user.stripeCustomerId) {
                    console.log(`[Billing] No stripeCustomerId for user ${ctx.user.id}`);
                    return { status: user?.subscriptionStatus || 'incomplete' };
                }

                // Import stripe dynamically or use the one from lib
                const { stripe } = await import("../../lib/stripe");
                if (!stripe) {
                    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe not configured' });
                }

                try {
                    const subscriptions = await stripe.subscriptions.list({
                        customer: user.stripeCustomerId,
                        status: 'all',
                        limit: 1
                    });

                    if (subscriptions.data.length === 0) {
                        console.log(`[Billing] No subscriptions found for user ${ctx.user.id}`);
                        return { status: user.subscriptionStatus };
                    }

                    const sub = subscriptions.data[0];
                    console.log(`[Billing] Found subscription ${sub.id} with status ${sub.status}`);

                    // Map Stripe price to internal Tier
                    // This is a rough mapping, ideally we'd look up the price ID in our config
                    let tier = user.planTier;
                    const priceId = sub.items.data[0].price.id;

                    // Reverse lookup price (simple check)
                    const p = config.stripe.prices;
                    if (priceId === p.startup.monthly || priceId === p.startup.yearly) tier = 'startup';
                    else if (priceId === p.guided.monthly || priceId === p.guided.yearly) tier = 'guided'; // or pro

                    // Update DB
                    await d.update(users)
                        .set({
                            subscriptionStatus: sub.status,
                            planTier: tier,
                            updatedAt: new Date()
                        })
                        .where(eq(users.id, ctx.user.id));

                    return { status: sub.status, tier };

                } catch (err) {
                    console.error("[Billing] Failed to sync subscription:", err);
                    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to sync with Stripe' });
                }
            }),
    });
};
