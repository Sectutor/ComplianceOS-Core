
import { useMemo, useSyncExternalStore } from "react";
import { useLocation } from "wouter";

function subscribe(callback: () => void) {
    window.addEventListener("popstate", callback);
    return () => window.removeEventListener("popstate", callback);
}

function getSnapshot() {
    return window.location.search;
}

export function useNistSystemId() {
    const [location] = useLocation();
    const search = useSyncExternalStore(subscribe, getSnapshot);

    return useMemo(() => {
        const params = new URLSearchParams(search);
        const systemId = params.get('systemId');
        
        // Return null if no systemId is provided, don't default to 'eco'
        // This ensures each system must have its own explicit ID
        return systemId;
    }, [search]);
}
