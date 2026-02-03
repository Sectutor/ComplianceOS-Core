import { useState } from 'react';
import { isBillingEnabled } from '../lib/config';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';

export function useBilling() {
    // isBillingEnabled is a const boolean, not a function
    const billingEnabled = isBillingEnabled;
    const saasMode = true;
    const [isLoading, setIsLoading] = useState(false);

    const createCheckoutMutation = trpc.billing.createCheckout.useMutation({
        onSuccess: (data) => {
            if (data.url) window.location.href = data.url;
        },
        onError: (err) => {
            toast.error(`Checkout failed: ${err.message}`);
            setIsLoading(false);
        }
    });

    const createPortalMutation = trpc.billing.createPortal.useMutation({
        onSuccess: (data) => {
            if (data.url) window.location.href = data.url;
        },
        onError: (err) => {
            toast.error(`Portal failed: ${err.message}`);
            setIsLoading(false);
        }
    });

    const upgradeToTier = async (clientId: number, tier: 'pro' | 'enterprise') => {
        if (!billingEnabled) return;
        setIsLoading(true);

        try {
            await createCheckoutMutation.mutateAsync({
                clientId,
                tier,
                successUrl: `${window.location.origin}/clients/${clientId}/settings?billing=success`,
                cancelUrl: `${window.location.origin}/clients/${clientId}/settings?billing=cancel`,
            });
        } catch (e) {
            setIsLoading(false);
        }
    };

    const upgradeToPro = (clientId: number) => upgradeToTier(clientId, 'pro');
    const upgradeToEnterprise = (clientId: number) => upgradeToTier(clientId, 'enterprise');

    const createUserCheckoutMutation = trpc.billing.createUserCheckout.useMutation({
        onSuccess: (data) => {
            if (data.url) window.location.href = data.url;
        },
        onError: (err) => {
            toast.error(`Account upgrade failed: ${err.message}`);
            setIsLoading(false);
        }
    });

    const upgradeAccount = async (tier: 'pro' | 'enterprise') => {
        if (!billingEnabled) return;
        setIsLoading(true);
        try {
            await createUserCheckoutMutation.mutateAsync({
                tier,
                successUrl: `${window.location.origin}/clients?upgrade=success`,
                cancelUrl: `${window.location.origin}/clients?upgrade=cancel`,
            });
        } catch (e) {
            setIsLoading(false);
        }
    };

    const manageSubscription = async (clientId: number) => {
        if (!billingEnabled) return;
        setIsLoading(true);
        try {
            await createPortalMutation.mutateAsync({
                clientId,
                returnUrl: `${window.location.origin}/clients/${clientId}/settings`,
            });
        } catch (e) {
            setIsLoading(false);
        }
    };

    return {
        billingEnabled,
        saasMode,
        isLoading: isLoading || createCheckoutMutation.isPending || createPortalMutation.isPending,
        upgradeToPro,
        upgradeToEnterprise,
        upgradeAccount,
        manageSubscription,
    };
}
