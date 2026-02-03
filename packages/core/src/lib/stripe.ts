import Stripe from 'stripe';
import { config } from './config';

// Initialize Stripe only if API key is present, otherwise mock or throw for safety
let stripeInstance: Stripe | null = null;

try {
    if (config.stripe.secretKey && config.stripe.secretKey.trim() !== '') {
        stripeInstance = new Stripe(config.stripe.secretKey.trim(), {
            apiVersion: '2024-06-20' as any,
            typescript: true,
        });
    } else {
        if (config.isBillingEnabled) {
            console.warn('[Stripe] Billing is enabled but STRIPE_SECRET_KEY is missing or empty.');
        }
    }
} catch (error) {
    console.error('[Stripe] Failed to initialize Stripe client:', error);
}

export const stripe = stripeInstance;

/**
 * Creates a Stripe Customer for a new Client
 */
export async function createStripeCustomer(clientName: string, email: string, metadata: Record<string, string>) {
    if (!stripe) return null;

    try {
        const customer = await stripe.customers.create({
            name: clientName,
            email: email,
            metadata: metadata,
        });
        return customer.id;
    } catch (error) {
        console.error('[Stripe] Failed to create customer:', error);
        throw error;
    }
}

/**
 * Creates a Checkout Session for a subscription
 */
export async function createCheckoutSession(
    customerId: string | undefined,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    metadata: Record<string, string>,
    mode: Stripe.Checkout.SessionCreateParams.Mode = 'subscription' // Default to subscription, but customizable
) {
    if (!stripe) throw new Error("Stripe not initialized");

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: mode,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: metadata,
    };

    if (customerId) {
        sessionParams.customer = customerId;
    } else {
        sessionParams.customer_email = metadata.customerEmail;
    }

    return stripe.checkout.sessions.create(sessionParams);
}

/**
 * Creates a Customer Portal Session for managing subscriptions
 */
export async function createPortalSession(customerId: string, returnUrl: string) {
    if (!stripe) throw new Error("Stripe not initialized");

    return stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });
}
