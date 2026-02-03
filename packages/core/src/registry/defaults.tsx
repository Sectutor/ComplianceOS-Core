import { registry } from './index';

export function registerDefaults() {
    console.log('[Registry] Registering CORE defaults...');
    
    // Core distribution has NO default AI components registered.
    // This file acts as the "Community Edition" config.
    // To enable AI features, import and call registerPremium() from ./premium.tsx
    
    console.log('[Registry] Core defaults registered (Clean Slate).');
}
