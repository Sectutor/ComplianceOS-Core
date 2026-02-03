import { z } from 'zod';

export const AddonStatusSchema = z.enum([
  'pending',
  'installing',
  'active',
  'inactive',
  'error',
  'updating',
  'uninstalling'
]);

export const AddonCategorySchema = z.enum([
  'integration',
  'template',
  'storage',
  'ai',
  'analytics',
  'notification',
  'compliance',
  'automation',
  'security',
  'utility'
]);

export const AddonManifestSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-z0-9]+)?(\+[a-z0-9]+)?$/),
  description: z.string().max(500),
  author: z.string().min(1).max(100),
  category: AddonCategorySchema,
  tags: z.array(z.string()).optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  license: z.string().optional(),
  icon: z.string().optional(),
  screenshots: z.array(z.string().url()).optional(),
  
  compatibility: z.object({
    minVersion: z.string().optional(),
    maxVersion: z.string().optional(),
  }).optional(),
  
  permissions: z.array(z.enum([
    'read:clients',
    'write:clients',
    'read:policies',
    'write:policies',
    'read:evidence',
    'write:evidence',
    'read:controls',
    'write:controls',
    'read:users',
    'admin',
    'webhook',
    'api',
    'notifications',
  ])).optional(),
  
  dependencies: z.record(z.string()).optional(),
  
  pricing: z.object({
    free: z.boolean().default(false),
    price: z.number().min(0).optional(),
    currency: z.string().default('USD'),
    billingPeriod: z.enum(['monthly', 'yearly', 'once']).optional(),
  }).optional(),
  
  features: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    required: z.boolean().default(false),
  })).optional(),
});

export type AddonManifest = z.infer<typeof AddonManifestSchema>;
export type AddonStatus = z.infer<typeof AddonStatusSchema>;
export type AddonCategory = z.infer<typeof AddonCategorySchema>;

export interface AddonContext {
  clientId?: number;
  userId?: number;
  organizationId?: number;
  permissions: string[];
}

export interface AddonConfiguration {
  [key: string]: unknown;
}

export interface AddonInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: AddonCategory;
  status: AddonStatus;
  icon?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  configuration?: AddonConfiguration;
  permissions: string[];
  tags?: string[];
  installedAt?: Date;
  updatedAt?: Date;
  error?: string;
}

export interface AddonHookResult {
  success: boolean;
  message?: string;
  data?: unknown;
}

export interface AddonInitializationResult {
  success: boolean;
  message?: string;
  error?: string;
}
