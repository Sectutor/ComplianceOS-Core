import { useEffect } from 'react';
import { useAdvisor } from '@/contexts/AdvisorContext';

export interface PageHelpContext {
    pageTitle: string;
    description: string;
    keyTopics: string[];
    // Optional: minimalistic summary of on-screen data to help the AI understand what the user is looking at
    // e.g. "5 high risks found"
    dataSummary?: Record<string, any>;
}

export function usePageHelp(context: PageHelpContext) {
    const { setContext } = useAdvisor();

    useEffect(() => {
        // Set the context when the component mounts or context changes
        setContext({
            type: 'page',
            id: window.location.pathname,
            data: context
        });

        // Optional: Clear context on unmount? 
        // For now, we'll let the next page overwrite it to avoid "flashing" or race conditions 
        // where it clears before the next one sets. 
        // But strictly it might be cleaner to clear. Let's try not clearing first.
        return () => {
            // setContext(null); // Intentionally commented out for now
        };
    }, [context.pageTitle, context.description, JSON.stringify(context.keyTopics)]); // Use primitives for deeper check
}
