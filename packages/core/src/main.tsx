import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabaseClient";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { registerDefaults } from "@/registry/defaults";
import { registerPremium } from "@/registry/premium";
import "./index.css";

// Initialize the Slot Registry
// 1. Register Core Defaults (Clean Slate)
registerDefaults();

// 2. Register Premium Features (AI, etc.)
// Controlled by VITE_ENABLE_PREMIUM env var (see .env)
// If 'false' or missing, Premium features are skipped (Open Source Mode)
if (import.meta.env.VITE_ENABLE_PREMIUM === 'true') {
  registerPremium();
} else {
  console.log('[Registry] Premium features disabled (Open Source Mode)');
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

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    if (error instanceof TRPCClientError && error.message === "NOT_FOUND") return;
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const safeTransformer = {
  serialize: (object: any) => {
    return superjson.serialize(object);
  },
  deserialize: (object: any) => {
    if (!object || object === '') {
      return null;
    }
    try {
      return superjson.deserialize(object);
    } catch (error) {
      console.error("[TRPC Transformer] JSON parse error:", error, "Data:", object);
      try {
        return JSON.parse(object);
      } catch (fallbackError) {
        console.error("[TRPC Transformer] Fallback JSON parse also failed:", fallbackError);
        return object;
      }
    }
  },
};

const trpcClient = trpc.createClient({
  // transformer: superjson,
  links: [
    httpBatchLink({
      url: "/api/trpc",
      maxURLLength: 2000,
      async headers() {
        const { data: { session } } = await supabase.auth.getSession();
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
          const contentType = response.headers.get('content-type');

          if (!response.ok) {
            const text = await response.text();
            console.error('[TRPC] HTTP Error:', {
              status: response.status,
              statusText: response.statusText,
              url,
              responseText: text.substring(0, 500)
            });

            if (contentType?.includes('application/json')) {
              try {
                const errorData = JSON.parse(text);
                const error = new Error(errorData.message || 'Request failed');
                (error as any).data = errorData;
                (error as any).code = errorData.code || 'INTERNAL_SERVER_ERROR';
                throw error;
              } catch {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          if (response.status === 204 || response.status === 204) {
            return new Response(JSON.stringify({}), {
              status: 200,
              headers: { 'content-type': 'application/json' }
            });
          }

          return response;
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
