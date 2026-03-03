/**
 * GitHub OAuth Callback Handler
 * 
 * This page handles the OAuth callback from GitHub, exchanges the code for a token via tRPC,
 * and redirects to the settings page after completion.
 */

import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { useClientContext } from "@/contexts/ClientContext";
import { Button } from "@complianceos/ui/ui/button";

export default function GitHubOAuthCallback() {
    const [, setLocation] = useLocation();
    const { selectedClientId } = useClientContext();
    const hasExchanged = useRef(false);

    // Validate client is selected - redirect if not
    if (selectedClientId === undefined || selectedClientId === null) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center space-y-4 bg-white/50 backdrop-blur-xl p-12 rounded-[3rem] border border-slate-200 shadow-2xl">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
                            <AlertCircle className="h-12 w-12 text-red-600 mx-auto relative z-10" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">No Organization Selected</h2>
                        <p className="text-slate-500 font-medium">
                            Please select an organization before connecting GitHub.
                        </p>
                        <Button onClick={() => setLocation("/settings/integrations")} className="mt-4">
                            Go to Integrations
                        </Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const clientId = selectedClientId;

    const exchangeMutation = trpc.integrations.handleOAuthCallback.useMutation({
        onSuccess: () => {
            toast.success("GitHub connected successfully!");
            setLocation("/settings/integrations?connected=true");
        },
        onError: (err) => {
            toast.error(`Failed to connect GitHub: ${err.message}`);
            setLocation("/settings/integrations?error=true");
        }
    });

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");
        const error = searchParams.get("error");
        const returnedState = searchParams.get("state");

        // Validate required params
        if (error) {
            toast.error(`OAuth Error: ${error}`);
            setLocation("/settings/integrations?error=oauth_error");
            return;
        }

        if (!code) {
            setLocation("/settings/integrations?error=missing_code");
            return;
        }

        // CSRF Protection: Validate state parameter
        const storedState = sessionStorage.getItem("github_oauth_state");
        if (!storedState || !returnedState || storedState !== returnedState) {
            console.error("[GitHub OAuth] State validation failed:", { storedState, returnedState });
            toast.error("OAuth security validation failed. Please try again.");
            setLocation("/settings/integrations?error=csrf_failed");
            return;
        }

        // Clear state after validation
        sessionStorage.removeItem("github_oauth_state");

        if (!hasExchanged.current) {
            hasExchanged.current = true;
            console.log(`[GitHub OAuth] Exchanging code for tenant ${clientId}...`);
            exchangeMutation.mutate({
                provider: "github",
                code: code,
                clientId: clientId
            });
        }
    }, [setLocation, exchangeMutation, clientId]);

    return (
        <DashboardLayout>
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4 bg-white/50 backdrop-blur-xl p-12 rounded-[3rem] border border-slate-200 shadow-2xl">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto relative z-10" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Finalizing Junction</h2>
                    <p className="text-slate-500 font-medium">
                        Securely establishing authentication with GitHub...
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}
