import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabaseClient";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import MFAChallengeModal from "@/components/auth/MFAChallengeModal";
import { useEffect, useState } from "react";
import { getLoginUrl } from "./const";
import { registerDefaults } from "@/registry/defaults";
import { registerPremium } from "@/registry/premium";
import "./index.css";

// Initialize the Slot Registry
// 1. Register Core Defaults (Clean Slate)
registerDefaults();

// 2. Register Premium Features (AI, etc.)
// Controlled by license validation system
import { licenseValidator } from '@/lib/license/index';

// Initialize license validator
const licenseInfo = licenseValidator.getLicenseInfo();
console.log('[License] Current license:', {
  type: licenseValidator.getLicenseType(),
  status: licenseInfo?.status,
  features: licenseInfo?.features?.length || 0
});

// Register premium features based on license
if (licenseValidator.isEnterpriseEdition() || licenseValidator.isTrialEdition()) {
  registerPremium();
  console.log('[Registry] Premium features registered (Enterprise/Trial Edition)');
} else {
  console.log('[Registry] Premium features disabled (Community Edition)');
}

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized =
    error.message === UNAUTHED_ERR_MSG ||
    error.data?.code === 'UNAUTHORIZED' ||
    error.message === 'UNAUTHORIZED';

  if (!isUnauthorized) return;

  const loginUrl = getLoginUrl();
  const isAtLogin = window.location.pathname.startsWith(loginUrl);

  console.warn("[Auth] Unauthorized access detected.");

  if (isAtLogin) {
    console.log("[Auth] Already at login page, just clearing session.");
    supabase.auth.signOut();
    return;
  }

  console.warn("[Auth] Clearing session and redirecting to login.");
  supabase.auth.signOut().then(() => {
    window.location.href = loginUrl;
  });
};

queryClient.getQueryCache().subscribe((event: any) => {
  if (event.type === "updated" && event.action?.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    if (error instanceof TRPCClientError && error?.data?.code === 'PRECONDITION_FAILED' && error.message === 'Multi-factor authentication required' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('require-mfa'));
    }
    if (error instanceof TRPCClientError && error.message === "NOT_FOUND") return;
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe((event: any) => {
  if (event.type === "updated" && event.action?.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    if (error instanceof TRPCClientError && error?.data?.code === 'PRECONDITION_FAILED' && error.message === 'Multi-factor authentication required' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('require-mfa'));
    }
    console.error("[API Mutation Error]", error);
  }
});

const trpcTransformer = superjson;

const trpcClient = trpc.createClient({
  transformer: trpcTransformer,
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: trpcTransformer,
      maxURLLength: 2000,
      async headers() {
        let session = null;
        try {
          const { data } = await supabase.auth.getSession();
          session = data?.session;
        } catch (e) {
          console.error('[TRPC] Anti-Gravity: Failed to fetch Supabase session for headers:', e);
          // If we can't even get session, we might be in a corrupted state
        }

        const reqId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

        // Pull selected client ID from localStorage for context preservation
        const selectedClientId = typeof window !== 'undefined' ? window.localStorage.getItem('selectedClientId') : null;

        const headers: Record<string, string> = {
          'x-request-id': reqId,
        };

        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        if (selectedClientId) {
          headers['x-client-id'] = selectedClientId;
        }

        return headers;
      },
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          credentials: 'include',
        }).then(async (response) => {
          if (!response.ok) {
            // Log for debugging but do NOT throw. Let TRPC handle the error response
            // throwing here breaks TRPC's ability to parse batched errors and metadata.
            const clone = response.clone();
            try {
              const text = await clone.text();
              console.warn('[TRPC] HTTP Error:', response.status, response.statusText, text.substring(0, 200));
            } catch (e) {
              console.warn('[TRPC] HTTP Error:', response.status, response.statusText);
            }
          }
          return response;
        });
      },
    }),
  ],
});

function AppWithMFA() {
  const [readyToShow, setReadyToShow] = useState(false);
  const [showMFAScreen, setShowMFAScreen] = useState(false);
  const [factorId, setFactorId] = useState<string | undefined>(undefined);
  useEffect(() => {
    const checkAAL = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (error) {
          console.warn("[MFA] AAL check error:", error.message);
          return;
        }

        // If user is at AAL1 but has factors (nextLevel is AAL2), show modal
        if (data?.nextLevel === 'aal2' && data?.nextLevel !== data?.currentLevel) {
          console.log("[MFA App Guard] Session requires AAL2. Showing modal.");
          setShowMFAScreen(true);

          // Background fetch factors for better UX
          supabase.auth.mfa.listFactors().then(({ data: lf }) => {
            const factorList = lf?.all || (lf as any)?.factors || [];
            const totp = factorList.find((f: any) => f.factor_type === 'totp' && f.status === 'verified');
            if (totp?.id) setFactorId(totp.id);
          });
        } else {
          setShowMFAScreen(false);
        }
      } finally {
        setReadyToShow(true);
      }
    };

    // Initial check
    checkAAL();

    // Listen for auth changes (including sign in)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'MFA_CHALLENGE_VERIFIED') {
        console.log("[MFA App Guard] Auth Event:", event);
        checkAAL();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      console.log("[MFA App Guard] require-mfa event intercepted");
      // If we already have factor info in the event, use it
      if (e.detail?.factorId) {
        setFactorId(e.detail.factorId);
      }
      setShowMFAScreen(true);
    };
    window.addEventListener('require-mfa', handler as EventListener);
    return () => {
      window.removeEventListener('require-mfa', handler as EventListener);
    };
  }, []);

  if (!readyToShow) return null;

  if (showMFAScreen) {
    return (
      <MFAChallengeModal
        open={true}
        onOpenChange={(o) => {
          setShowMFAScreen(o);
          // If they close it without verifying, we might want to re-check AAL 
          // to ensure they aren't bypassing it if it's mandatory.
        }}
        factorId={factorId}
      />
    );
  }
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <AppWithMFA />
    </QueryClientProvider>
  </trpc.Provider>
);
