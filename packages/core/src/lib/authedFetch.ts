import { supabase } from '@/lib/supabaseClient';

/**
 * A thin wrapper around `fetch` that automatically attaches the current
 * Supabase session token as an `Authorization: Bearer <token>` header.
 *
 * Use this instead of raw `fetch` for any requests to authenticated
 * server endpoints (e.g. `/api/upload`, `/api/export`, `/api/ai`).
 *
 * Usage:
 *   const res = await authedFetch('/api/upload', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ ... })
 *   });
 */
export async function authedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let token: string | undefined;

    try {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token ?? undefined;
    } catch (e) {
        console.warn('[authedFetch] Failed to retrieve Supabase session:', e);
    }

    const headers = new Headers(init?.headers);

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    } else {
        console.warn('[authedFetch] No active session token — request will be sent unauthenticated.');
    }

    return fetch(input, {
        ...init,
        credentials: 'include',
        headers,
    });
}
