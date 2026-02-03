import { sql } from "drizzle-orm";

export interface EnvConfig {
    DATABASE_URL: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    FORGE_API_KEY?: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export function validateEnv(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required environment variables
    if (!process.env.DATABASE_URL) {
        errors.push('DATABASE_URL is required for database connection');
    }

    if (!process.env.SUPABASE_URL) {
        errors.push('SUPABASE_URL is required for authentication');
    }

    if (!process.env.SUPABASE_ANON_KEY) {
        errors.push('SUPABASE_ANON_KEY is required for authentication');
    }

    // Optional features with warnings
    if (!process.env.STRIPE_SECRET_KEY) {
        warnings.push('Stripe billing disabled: STRIPE_SECRET_KEY not configured');
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        warnings.push('Stripe webhooks disabled: STRIPE_WEBHOOK_SECRET not configured');
    }

    if (!process.env.FORGE_API_KEY) {
        warnings.push('AI features disabled: FORGE_API_KEY not configured');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

export interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
        database: boolean;
        stripe?: boolean;
    };
    timestamp: string;
}

export async function healthCheck(): Promise<HealthCheckResult> {
    const services = {
        database: false,
        stripe: undefined as boolean | undefined,
    };

    // Test database connection
    try {
        const { getDb } = await import('../db');
        const db = await getDb();
        if (!db) throw new Error('Database connection is null');
        await db.execute(sql`SELECT 1`);
        services.database = true;
    } catch (err) {
        console.error('❌ Database health check failed:', err);
        services.database = false;
    }

    // Test Stripe connection (if configured)
    if (process.env.STRIPE_SECRET_KEY) {
        try {
            const stripe = (await import('stripe')).default;
            const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY, {
                apiVersion: '2025-12-15.clover',
            });
            // Simple API call to verify connection
            await stripeClient.balance.retrieve();
            services.stripe = true;
        } catch (err) {
            console.error('❌ Stripe health check failed:', err);
            services.stripe = false;
        }
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (services.database && (services.stripe === undefined || services.stripe)) {
        status = 'healthy';
    } else if (services.database) {
        status = 'degraded'; // DB works but optional services don't
    } else {
        status = 'unhealthy'; // DB is down
    }

    return {
        status,
        services,
        timestamp: new Date().toISOString(),
    };
}

export function logValidationResults(result: ValidationResult): void {
    if (!result.valid) {
        console.error('❌ Environment validation failed:');
        result.errors.forEach(err => console.error(`  - ${err}`));
    } else {
        console.log('✅ Environment validation passed');
    }

    if (result.warnings.length > 0) {
        console.warn('⚠️  Warnings:');
        result.warnings.forEach(warn => console.warn(`  - ${warn}`));
    }
}
