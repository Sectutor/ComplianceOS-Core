
import { useMemo, useSyncExternalStore } from "react";
import { useLocation } from "wouter";

function subscribe(callback: () => void) {
    window.addEventListener("popstate", callback);
    window.addEventListener("pushstate", callback); // Custom support for pushstate
    window.addEventListener("replacestate", callback);
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // Patch history to notify our store
    history.pushState = function (...args) {
        originalPushState.apply(this, args);
        callback();
    };
    history.replaceState = function (...args) {
        originalReplaceState.apply(this, args);
        callback();
    };

    return () => {
        window.removeEventListener("popstate", callback);
        window.removeEventListener("pushstate", callback);
        window.removeEventListener("replacestate", callback);
        history.pushState = originalPushState;
        history.replaceState = originalReplaceState;
    };
}

function getSnapshot() {
    return window.location.search;
}

export function useNistSystemId(): number | undefined {
    const search = useSyncExternalStore(subscribe, getSnapshot);

    return useMemo(() => {
        const params = new URLSearchParams(search);
        const val = params.get('systemId');
        if (!val) return undefined;
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? undefined : parsed;
    }, [search]);
}
