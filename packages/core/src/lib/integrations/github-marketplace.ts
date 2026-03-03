/**
 * GitHub Marketplace Client
 * 
 * Fetches integration manifests from GitHub registry.
 * This enables community integrations to be discovered and installed.
 */

import type {
    IntegrationManifest,
    GitHubRegistryEntry,
    MarketplaceEntry
} from './types';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';
const GITHUB_API_BASE = 'https://api.github.com';

// Default registry configuration
const DEFAULT_REGISTRY = {
    owner: 'complianceos',
    repo: 'integrations',
    branch: 'main',
    manifestFile: 'index.json'
};

interface RegistryConfig {
    owner: string;
    repo: string;
    branch: string;
    manifestFile: string;
}

export class GitHubMarketplaceClient {
    private config: RegistryConfig;
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private cacheTTL = 5 * 60 * 1000; // 5 minutes

    constructor(config: Partial<RegistryConfig> = {}) {
        this.config = { ...DEFAULT_REGISTRY, ...config };
    }

    /**
     * Fetch the registry index from GitHub
     */
    async fetchRegistry(): Promise<GitHubRegistryEntry[]> {
        const cacheKey = 'registry-index';
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const url = `${GITHUB_RAW_BASE}/${this.config.owner}/${this.config.repo}/${this.config.branch}/${this.config.manifestFile}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch registry: ${response.statusText}`);
            }

            const data = await response.json();
            const entries = data.integrations || [];

            this.setCache(cacheKey, entries);
            return entries;
        } catch (error) {
            console.error('[GitHubMarketplace] Error fetching registry:', error);
            // Return empty array if registry is not available
            return [];
        }
    }

    /**
     * Fetch a specific integration manifest from GitHub
     */
    async fetchManifest(slug: string): Promise<IntegrationManifest | null> {
        const cacheKey = `manifest-${slug}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const url = `${GITHUB_RAW_BASE}/${this.config.owner}/${this.config.repo}/${this.config.branch}/registry/${slug}/manifest.json`;
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`Failed to fetch manifest: ${response.statusText}`);
            }

            const manifest = await response.json();
            this.setCache(cacheKey, manifest);
            return manifest;
        } catch (error) {
            console.error(`[GitHubMarketplace] Error fetching manifest for ${slug}:`, error);
            return null;
        }
    }

    /**
     * Fetch all marketplace entries with their manifests
     */
    async fetchMarketplace(): Promise<MarketplaceEntry[]> {
        const entries = await this.fetchRegistry();
        const marketplace: MarketplaceEntry[] = [];

        // Fetch manifests in parallel (limit to 10 at a time)
        const batchSize = 10;
        for (let i = 0; i < entries.length; i += batchSize) {
            const batch = entries.slice(i, i + batchSize);
            const results = await Promise.all(
                batch.map(async (entry) => {
                    const manifest = await this.fetchManifest(entry.slug);
                    if (!manifest) return null;

                    return {
                        manifest,
                        installed: false,
                        connected: false,
                        rating: 0,
                        downloads: 0,
                        verified: entry.verified
                    };
                })
            );

            marketplace.push(...results.filter((r): r is MarketplaceEntry => r !== null) as MarketplaceEntry[]);
        }

        return marketplace;
    }

    /**
     * Search integrations by query or category
     */
    async search(query: string, category?: string): Promise<MarketplaceEntry[]> {
        const marketplace = await this.fetchMarketplace();

        return marketplace.filter(entry => {
            const searchText = `${entry.manifest.name} ${entry.manifest.description} ${entry.manifest.tags.join(' ')}`.toLowerCase();
            const matchesQuery = !query || searchText.includes(query.toLowerCase());
            const matchesCategory = !category || entry.manifest.category === category;

            return matchesQuery && matchesCategory;
        });
    }

    /**
     * Get integration by slug
     */
    async get(slug: string): Promise<MarketplaceEntry | null> {
        const manifest = await this.fetchManifest(slug);
        if (!manifest) return null;

        const entries = await this.fetchRegistry();
        const entry = entries.find(e => e.slug === slug);

        return {
            manifest,
            installed: false,
            connected: false,
            rating: 0,
            downloads: 0,
            verified: entry?.verified || false
        };
    }

    /**
     * Clear the cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get available categories from marketplace
     */
    async getCategories(): Promise<string[]> {
        const marketplace = await this.fetchMarketplace();
        const categories = new Set(marketplace.map(m => m.manifest.category));
        return Array.from(categories).sort();
    }

    // Private helper methods
    private getCached(key: string): any | null {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    private setCache(key: string, data: any): void {
        this.cache.set(key, { data, timestamp: Date.now() });
    }
}

// Default client instance
export const githubMarketplace = new GitHubMarketplaceClient();

// Helper to create custom client
export function createMarketplaceClient(config: Partial<RegistryConfig>): GitHubMarketplaceClient {
    return new GitHubMarketplaceClient(config);
}
