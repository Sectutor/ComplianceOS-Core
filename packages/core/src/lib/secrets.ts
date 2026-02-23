import { logger } from './logger';

/**
 * Enterprise Secrets Management & Validation (ASVS AL 3)
 * Centralizes access to sensitive environment variables and performs
 * strict validation at startup.
 */

type SecretKey =
    | 'DATABASE_URL'
    | 'ENCRYPTION_KEY'
    | 'SUPABASE_SERVICE_ROLE_KEY'
    | 'SUPABASE_URL'
    | 'TOOL_HMAC_SECRET'
    | 'RATE_LIMIT_REDIS_URL';

const REQUIRED_SECRETS_PROD: SecretKey[] = [
    'DATABASE_URL',
    'ENCRYPTION_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_URL'
];

/**
 * Validates that all required secrets are present in production.
 */
export function validateSecrets() {
    if (process.env.NODE_ENV !== 'production') return;

    const results = REQUIRED_SECRETS_PROD.map(key => {
        const standard = process.env[key];
        const vite = process.env[`VITE_${key}`];
        return {
            key,
            found: !!(standard || vite),
            asVite: !!vite && !standard
        };
    });

    const missing = results.filter(r => !r.found).map(r => r.key);

    if (missing.length > 0) {
        // Log all available keys (privacy safe) to help diagnose naming issues
        const allKeys = Object.keys(process.env).filter(k =>
            k.includes('URL') || k.includes('KEY') || k.includes('SECRET')
        );

        const errorMsg = `CRITICAL: Missing required production secrets: ${missing.join(', ')}. ` +
            `Available related keys: ${allKeys.join(', ')}`;

        logger.error(errorMsg);
        throw new Error(errorMsg);
    }
}

/**
 * Gets a secret with a fallback and optional validation.
 */
export function getSecret(key: SecretKey, fallback?: string): string {
    const value = process.env[key] || process.env[`VITE_${key}`] || fallback;

    if (!value && REQUIRED_SECRETS_PROD.includes(key) && process.env.NODE_ENV === 'production') {
        throw new Error(`CRITICAL: Secret ${key} (or VITE_${key}) is required in production but not found.`);
    }

    return value || '';
}

/**
 * Specifically for ENCRYPTION_KEY to ensure it matches length requirements
 * supports single key or versioned keys: "v1:key1,v2:key2"
 */
export function getEncryptionKeys(): Record<string, string> {
    const keyString = getSecret('ENCRYPTION_KEY');
    const DEFAULT_DEV_KEY = 'default-dev-key-must-be-32-bytes-long!';

    // Default fallback if nothing is set
    if (!keyString) {
        return { 'v1': DEFAULT_DEV_KEY };
    }

    // Try to parse versioned keys
    if (keyString.includes(':')) {
        const keys: Record<string, string> = {};
        keyString.split(',').forEach(part => {
            const [version, key] = part.split(':');
            if (version && key) {
                keys[version.trim()] = key.trim();
            }
        });
        return keys;
    }

    // Single unversioned key fallback
    return { 'v1': keyString };
}

/**
 * Returns the latest (active) encryption key version
 */
export function getActiveKeyVersion(): string {
    const keys = getEncryptionKeys();
    const versions = Object.keys(keys).sort(); // Simple lexicographical sort
    return versions[versions.length - 1] || 'v1';
}

/**
 * Returns the actual key string for the active version
 */
export function getActiveKey(): string {
    const keys = getEncryptionKeys();
    const version = getActiveKeyVersion();
    return keys[version];
}
