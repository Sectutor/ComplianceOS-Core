
import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '../../lib/trpc';
import { Loader2 } from 'lucide-react';
import { toast } from "sonner";

export default function OAuthCallback() {
    const [location, setLocation] = useLocation();
    const [status, setStatus] = useState('Processing authentication...');

    const exchangeMutation = trpc.integrations.exchangeCode.useMutation({
        onSuccess: () => {
            toast.success("Integration connected successfully.");
            setLocation('/admin/integrations');
        },
        onError: (err) => {
            setStatus('Failed to connect.');
            toast.error(`Connection Error: ${err.message}`);
        }
    });

    useEffect(() => {
        // Extract query params manually since wouter doesn't parse them automatically in hook
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code || !state) {
            setStatus('Invalid callback URL. Missing code or state.');
            return;
        }

        try {
            const decodedState = JSON.parse(atob(state));

            // Prevent double submission if effect runs twice (React 18 Strict Mode)
            if (exchangeMutation.isLoading || exchangeMutation.isSuccess) return;

            exchangeMutation.mutate({
                clientId: decodedState.clientId || 1, // Fallback to 1 if not present
                provider: decodedState.provider,
                code: code
            });
        } catch (e) {
            setStatus('Invalid state parameter.');
        }
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold">{status}</h2>
            <p className="text-muted-foreground mt-2">Please wait while we complete the connection.</p>
        </div>
    );
}
