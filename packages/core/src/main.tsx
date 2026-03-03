import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabaseClient";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, retryLink, TRPCClientError } from "@trpc/client";
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

const redirectToLoginIfUnauthorized = async (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized =
    error.message === UNAUTHED_ERR_MSG ||
    error.data?.code === 'UNAUTHORIZED' ||
    error.message === 'UNAUTHORIZED' ||
    error.message?.includes('Authentication required') ||
    error.message?.includes('sign in');

  if (!isUnauthorized) return;

  // Check if we actually have a session still
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    console.warn("[Auth] Received UNAUTHORIZED but session exists. Possibly a transient error or DB sync issue. Not redirecting.", {
      path: (error as any).meta?.path || error.shape?.data?.path || 'unknown',
      message: error.message
    });
    return;
  }

  const loginUrl = getLoginUrl();
  const isAtLogin = window.location.pathname.startsWith(loginUrl);

  console.warn("[Auth] Unauthorized access detected.");

  if (isAtLogin) {
    console.log("[Auth] Already at login page, just clearing local storage.");
    // Clear potentially stale ID
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('selectedClientId');
    }
    return;
  }

  console.warn("[Auth] No session found. Redirecting to login.");
  window.location.href = loginUrl;
};

queryClient.getQueryCache().subscribe((event: any) => {
  if (event.type === "updated" && event.action?.type === "error") {
    const error = event.query.state.error;

    // Enhanced error logging for UNAUTHORIZED errors
    const isAuthError = error instanceof TRPCClientError &&
      (error.message === UNAUTHED_ERR_MSG ||
        error.data?.code === 'UNAUTHORIZED' ||
        error.message === 'UNAUTHORIZED' ||
        error.message?.includes('Authentication required') ||
        error.message?.includes('sign in'));

    if (isAuthError) {
      console.error('[AUTH FAILURE DETECTED]', {
        message: error.message,
        code: error.data?.code,
        path: (error as any).meta?.path || (error as any).shape?.data?.path || 'unknown',
        stack: error.stack
      });

      redirectToLoginIfUnauthorized(error);
    }

    if (error instanceof TRPCClientError &&
      error?.data?.code === 'PRECONDITION_FAILED' &&
      (error.message === 'Multi-factor authentication required' || error.message.includes('Administrative access requires active Multi-factor Authentication')) &&
      typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('require-mfa'));
    }

    if (error instanceof TRPCClientError && error.message === "NOT_FOUND") return;

    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe((event: any) => {
  if (event.type === "updated" && event.action?.type === "error") {
    const error = event.mutation.state.error;

    const isAuthError = error instanceof TRPCClientError &&
      (error.message === UNAUTHED_ERR_MSG ||
        error.data?.code === 'UNAUTHORIZED' ||
        error.message === 'UNAUTHORIZED' ||
        error.message?.includes('Authentication required') ||
        error.message?.includes('sign in'));

    if (isAuthError) {
      console.error('[AUTH FAILURE DETECTED IN MUTATION]', {
        message: error.message,
        code: error.data?.code,
        path: (error as any).meta?.path || (error as any).shape?.data?.path || 'unknown'
      });
      redirectToLoginIfUnauthorized(error);
    }

    if (error instanceof TRPCClientError &&
      error?.data?.code === 'PRECONDITION_FAILED' &&
      (error.message === 'Multi-factor authentication required' || error.message.includes('Administrative access requires active Multi-factor Authentication')) &&
      typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('require-mfa'));
    }

    console.error("[API Mutation Error]", error);
  }
});


const trpcTransformer = superjson;

const trpcClient = trpc.createClient({
  links: [
    // Retry link to handle transient network errors
    retryLink({
      retry: (opts) => {
        const { error, count } = opts;
        // Only retry on network errors, not on HTTP errors or TRPC errors
        const isNetworkError = error.message?.includes('fetch') ||
          error.message?.includes('network') ||
          error.message?.includes('unexpected end of data');
        const maxRetries = 3;

        if (isNetworkError && count < maxRetries) {
          console.warn(`[TRPC] Retrying request (attempt ${count}/${maxRetries}):`, error.message);
          return true;
        }
        return false;
      },
      retryDelayMs: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000), // Exponential backoff, max 3s
    }),
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
          console.error('[TRPC] Failed to fetch Supabase session for headers:', e);
        }

        const reqId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

        // Pull selected client ID from localStorage for context preservation
        const selectedClientId = typeof window !== 'undefined' ? window.localStorage.getItem('selectedClientId') : null;

        const headers: Record<string, string> = {
          'x-request-id': reqId,
        };

        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
          console.log(`[TRPC Client] Sending request with auth token (session user: ${session.user?.email})`);
        } else {
          console.warn(`[TRPC Client] Sending request WITHOUT auth token - session:`, session ? 'present but no token' : 'null');
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
            // Log for debugging but do NOT consume the response body.
            // Consuming the body with clone.text() causes "unexpected end of data" errors
            // because TRPC's httpBatchLink also needs to read the response body.
            console.warn('[TRPC] HTTP Error:', response.status, response.statusText, 'URL:', url);
          }
          return response;
        }).catch((error) => {
          // Handle network errors (ECONNREFUSED, network timeout, etc.)
          console.error('[TRPC] Network Error - Failed to fetch:', error?.message || error);
          // Re-throw to let TRPC handle it properly
          throw error;
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
          // Note: we let the modal handle the rejection logic properly 
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


