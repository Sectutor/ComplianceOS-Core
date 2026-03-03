import React, { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useClientContext } from '@/contexts/ClientContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function SlackOAuthCallback() {
    const [location, setLocation] = useLocation();
    const { selectedClientId } = useClientContext();
    const hasExchanged = useRef(false);

    // Use client from session if available
    // CRITICAL: Never fall back to clientId=1 - this is a security risk
    // that could cause OAuth integrations to attach to the wrong client
    let clientId = selectedClientId || parseInt(sessionStorage.getItem('last_client_id') || '0');

    if (!selectedClientId && sessionStorage.getItem('last_client_id')) {
        console.warn('[SlackOAuth] No selectedClientId, falling back to session client ID:', clientId);
    } else if (!selectedClientId) {
        // CRITICAL SECURITY FIX: Do NOT fall back to clientId=1
        // Instead, show an error and require explicit client selection
        console.error('[SlackOAuth] No client in session - OAuth requires explicit client selection');
        toast.error('No client selected. Please select a client workspace before connecting integrations.');
        setLocation('/settings/integrations');
        return;
    }

    const isValidClient = clientId !== null && clientId !== undefined && clientId > 0;

    const mutation = trpc.integrations.handleOAuthCallback.useMutation({
        onSuccess: () => {
            toast.success('Slack connected successfully');
            setLocation('/settings/integrations');
        },
        onError: (error) => {
            console.error('[SlackOAuth] Error:', error);
            toast.error(`Failed to connect Slack: ${error.message}`);
            setLocation('/settings/integrations');
        }
    });

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
            toast.error(`Slack Error: ${error}`);
            setLocation('/settings/integrations');
            return;
        }

        if (!code) {
            toast.error('No code received from Slack');
            setLocation('/settings/integrations');
            return;
        }

        // CRITICAL: Validate client selection before proceeding with OAuth
        if (!isValidClient) {
            toast.error('No client selected. Please select a client workspace before connecting integrations.');
            setLocation('/settings/integrations');
            return;
        }

        // CSRF protection check
        const savedState = sessionStorage.getItem("slack_oauth_state");
        if (state && savedState && state !== savedState) {
            toast.error('Invalid state parameter. Possible CSRF attack.');
            setLocation('/settings/integrations');
            return;
        }

        if (!hasExchanged.current) {
            hasExchanged.current = true;
            console.log(`[SlackOAuth] Exchanging code for tenant ${clientId}`);
            mutation.mutate({
                provider: 'slack',
                code,
                clientId
            });

            // Clear state after use
            sessionStorage.removeItem("slack_oauth_state");
        }
    }, [location, clientId, setLocation, mutation]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Finalizing Slack Connection...</h2>
            <p className="text-slate-500">Please wait while we complete the integration.</p>
        </div>
    );
}

export default SlackOAuthCallback;
