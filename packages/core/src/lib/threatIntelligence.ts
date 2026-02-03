/**
 * Threat Intelligence Service
 * 
 * Integrates with NVD (National Vulnerability Database) and CISA KEV (Known Exploited Vulnerabilities)
 * to discover and suggest relevant vulnerabilities for assets.
 */

import { getDb } from '../db';
import { nvdCveCache, cisaKevCache, assetCveMatches, threatIntelSyncLog, assets, vendors, vendorCveMatches, type Asset, type Vendor } from '../schema';
import { eq } from 'drizzle-orm';

// ==================== TYPE DEFINITIONS ====================

export interface NvdCveResponse {
    vulnerabilities: {
        cve: {
            id: string;
            descriptions: { lang: string; value: string }[];
            published: string;
            lastModified: string;
            metrics?: {
                cvssMetricV31?: {
                    cvssData: {
                        baseScore: number;
                        vectorString: string;
                    };
                }[];
                cvssMetricV2?: {
                    cvssData: {
                        baseScore: number;
                        vectorString: string;
                    };
                }[];
            };
            weaknesses?: {
                description: { lang: string; value: string }[];
            }[];
            references?: {
                url: string;
                tags?: string[];
            }[];
            configurations?: {
                nodes: {
                    cpeMatch?: {
                        criteria: string;
                        vulnerable: boolean;
                    }[];
                }[];
            }[];
        };
    }[];
    totalResults: number;
    resultsPerPage: number;
}

export interface CisaKevResponse {
    title: string;
    catalogVersion: string;
    dateReleased: string;
    count: number;
    vulnerabilities: {
        cveID: string;
        vendorProject: string;
        product: string;
        vulnerabilityName: string;
        dateAdded: string;
        shortDescription: string;
        requiredAction: string;
        dueDate: string;
        knownRansomwareCampaignUse: string; // "Known" or "Unknown"
    }[];
}

export interface CveSuggestion {
    cveId: string;
    description: string;
    cvssScore: string | null;
    isKev: boolean;
    matchScore: number;
    matchReason: string;
    status: string;
    cweIds?: string[];
    references?: { url: string; tags?: string[] }[];
    affectedProducts?: string[];
}

export interface BreachSuggestion {
    title: string;
    description: string;
    breachDate: Date;
    recordCount: number;
    dataClasses: string[];
    riskScore: number;
    source: string;
    isVerified: boolean;
}

// ==================== CONSTANTS ====================

const NVD_API_BASE = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const CISA_KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
const CACHE_EXPIRY_HOURS = 24;
const NVD_RATE_LIMIT_MS = 6000; // NVD allows ~6 requests per minute without API key

// ==================== NVD API FUNCTIONS ====================

/**
 * Search NVD for CVEs by keyword
 */
/**
 * Generate a CPE 2.3 string from vendor, product, and version
 * Format: cpe:2.3:a:vendor:product:version:*:*:*:*:*:*:*
 */
export function generateCpeString(vendor: string, product: string, version?: string): string {
    const clean = (s: string) => s.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_\-\.]/g, '');

    const v = clean(vendor);
    const p = clean(product);
    const ver = version ? clean(version) : '*';

    // Default to application ('a') type
    return `cpe:2.3:a:${v}:${p}:${ver}:*:*:*:*:*:*:*`;
}

/**
 * Search NVD for CVEs by keyword or CPE
 */
export async function searchNvdByKeyword(keyword: string, maxResults: number = 20, cpeName?: string): Promise<NvdCveResponse | null> {
    try {
        const params = new URLSearchParams();
        params.append('resultsPerPage', maxResults.toString());

        if (cpeName) {
            params.append('cpeName', cpeName);
            params.append('isVulnerable', 'true');
        } else {
            params.append('keywordSearch', keyword);
        }

        // Add API key if available (increases rate limit)
        if (process.env.NVD_API_KEY) {
            params.append('apiKey', process.env.NVD_API_KEY);
        }

        const response = await fetch(`${NVD_API_BASE}?${params.toString()}`, {
            headers: { 'Accept': 'application/json' },
        });

        if (response.status === 403 || response.status === 429) {
            console.warn('[ThreatIntel] NVD API rate limit reached');
            return null;
        }

        if (!response.ok) {
            console.error(`NVD API error: ${response.status} ${response.statusText}`);
            return null;
        }

        return await response.json() as NvdCveResponse;
    } catch (error) {
        console.error('Failed to search NVD:', error);
        return null;
    }
}

/**
 * Get a specific CVE by ID from NVD
 */
export async function getCveById(cveId: string): Promise<NvdCveResponse | null> {
    try {
        const url = `${NVD_API_BASE}?cveId=${cveId}`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`NVD API error: ${response.status}`);
            return null;
        }

        return await response.json() as NvdCveResponse;
    } catch (error) {
        console.error('Failed to fetch CVE:', error);
        return null;
    }
}

/**
 * Cache CVE data in the database
 */
export async function cacheCveData(cve: NvdCveResponse['vulnerabilities'][0]['cve']): Promise<void> {
    const db = await getDb();
    if (!db) {
        console.warn('[ThreatIntel] Database not available for caching');
        return;
    }

    const description = cve.descriptions.find(d => d.lang === 'en')?.value || cve.descriptions[0]?.value;

    // Extract CVSS score (prefer v3.1, fallback to v2)
    const cvssV31 = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
    const cvssV2 = cve.metrics?.cvssMetricV2?.[0]?.cvssData;
    const cvssScore = cvssV31?.baseScore?.toString() || cvssV2?.baseScore?.toString() || null;
    const cvssVector = cvssV31?.vectorString || cvssV2?.vectorString || null;

    // Extract CWE IDs
    const cweIds = cve.weaknesses?.flatMap(w =>
        w.description.filter(d => d.value.startsWith('CWE-')).map(d => d.value)
    ) || [];

    // Extract affected products (CPE strings OR formatted version ranges)
    const affectedProducts = cve.configurations?.flatMap(config =>
        config.nodes.flatMap(node =>
            node.cpeMatch?.filter(m => m.vulnerable).map((m: any) => {
                // Generate human-readable version ranges if available
                const parts = [];
                if (m.versionStartIncluding) parts.push(`>= ${m.versionStartIncluding}`);
                if (m.versionStartExcluding) parts.push(`> ${m.versionStartExcluding}`);
                if (m.versionEndIncluding) parts.push(`<= ${m.versionEndIncluding}`);
                if (m.versionEndExcluding) parts.push(`< ${m.versionEndExcluding}`);

                // If we have version parts, return them (e.g. ">= 1.0.0 and < 2.0.0")
                // Otherwise fall back to the CPE criteria string
                return parts.length > 0 ? parts.join(' and ') : m.criteria;
            }) || []
        )
    ) || [];

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_EXPIRY_HOURS);

    await db.insert(nvdCveCache)
        .values({
            cveId: cve.id,
            cvssScore,
            cvssVector,
            cweIds,
            description,
            publishedDate: new Date(cve.published),
            lastModifiedDate: new Date(cve.lastModified),
            affectedProducts,
            references: cve.references || [],
            rawData: cve,
            fetchedAt: new Date(),
            expiresAt,
        })
        .onConflictDoUpdate({
            target: nvdCveCache.cveId,
            set: {
                cvssScore,
                cvssVector,
                cweIds,
                description,
                publishedDate: new Date(cve.published),
                lastModifiedDate: new Date(cve.lastModified),
                affectedProducts,
                references: cve.references || [],
                rawData: cve,
                fetchedAt: new Date(),
                expiresAt,
            },
        });
}

// ==================== CISA KEV FUNCTIONS ====================

/**
 * Fetch and cache the CISA KEV catalog
 */
export async function syncCisaKevCatalog(): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    try {
        const response = await fetch(CISA_KEV_URL);
        if (!response.ok) {
            throw new Error(`CISA KEV fetch failed: ${response.status}`);
        }

        const data = await response.json() as CisaKevResponse;

        // Log sync start
        const [syncLog] = await db.insert(threatIntelSyncLog).values({
            source: 'cisa_kev',
            syncType: 'full',
            status: 'started',
            startedAt: new Date(),
        }).returning();

        let processed = 0;

        // Process in batches
        for (const vuln of data.vulnerabilities) {
            await db.insert(cisaKevCache)
                .values({
                    cveId: vuln.cveID,
                    vendorProject: vuln.vendorProject,
                    product: vuln.product,
                    vulnerabilityName: vuln.vulnerabilityName,
                    shortDescription: vuln.shortDescription,
                    requiredAction: vuln.requiredAction,
                    dueDate: new Date(vuln.dueDate),
                    knownRansomwareCampaignUse: vuln.knownRansomwareCampaignUse === 'Known',
                    dateAdded: new Date(vuln.dateAdded),
                    fetchedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: cisaKevCache.cveId,
                    set: {
                        vendorProject: vuln.vendorProject,
                        product: vuln.product,
                        vulnerabilityName: vuln.vulnerabilityName,
                        shortDescription: vuln.shortDescription,
                        requiredAction: vuln.requiredAction,
                        dueDate: new Date(vuln.dueDate),
                        knownRansomwareCampaignUse: vuln.knownRansomwareCampaignUse === 'Known',
                        dateAdded: new Date(vuln.dateAdded),
                        fetchedAt: new Date(),
                    },
                });
            processed++;
        }

        // Update sync log
        await db.update(threatIntelSyncLog)
            .set({
                status: 'completed',
                recordsProcessed: processed,
                completedAt: new Date(),
            })
            .where(eq(threatIntelSyncLog.id, syncLog.id));

        return processed;
    } catch (error) {
        console.error('Failed to sync CISA KEV:', error);
        throw error;
    }
}

/**
 * Check if a CVE is in the KEV catalog
 */
export async function isInKevCatalog(cveId: string): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    const result = await db.select({ id: cisaKevCache.id })
        .from(cisaKevCache)
        .where(eq(cisaKevCache.cveId, cveId))
        .limit(1);

    return result.length > 0;
}

// ==================== ASSET SCANNING FUNCTIONS ====================

/**
 * Extract search keywords from an asset
 * Prioritizes structured fields (vendor, product, version) over generic name parsing
 * ONLY works for Software and Hardware asset types (NVD CVEs don't apply to other types)
 */
export function extractKeywordsFromAsset(asset: Asset): string[] {
    const keywords: string[] = [];

    // Only process Software and Hardware assets - NVD CVEs are not relevant for other types
    const allowedTypes = ['Software', 'Hardware'];
    if (!asset.type || !allowedTypes.includes(asset.type)) {
        console.log(`[ThreatIntel] Skipping asset type "${asset.type}" - NVD only applies to Software/Hardware`);
        return [];
    }

    // Priority 1: Use structured technical identifiers if available
    // These provide the most accurate NVD search results
    if (asset.vendor && asset.productName) {
        // Best case: "vendor product" e.g., "apache tomcat"
        keywords.push(`${asset.vendor} ${asset.productName}`);

        // Also try with version if available
        if (asset.version) {
            keywords.push(`${asset.vendor} ${asset.productName} ${asset.version}`);
        }
    } else if (asset.productName) {
        // Just product name
        keywords.push(asset.productName);
    } else if (asset.vendor) {
        // Just vendor - useful for finding vendor-wide CVEs
        keywords.push(asset.vendor);
    }

    // Priority 2: Use technologies array if available
    if (asset.technologies && Array.isArray(asset.technologies) && asset.technologies.length > 0) {
        // Each technology is a potential search term
        for (const tech of asset.technologies.slice(0, 3)) { // Limit to 3
            if (tech && typeof tech === 'string' && tech.length > 2) {
                keywords.push(tech);
            }
        }
    }

    // Priority 3: Fall back to parsing asset name - but ONLY if we have NO structured data
    // This prevents generic names like "Customer Database" from being searched
    if (keywords.length === 0) {
        // For Software/Hardware without structured data, require explicit product info
        console.log(`[ThreatIntel] Asset "${asset.name}" has no vendor/product info - please add technical identifiers`);
        return [];
    }

    return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Scan a single asset for matching CVEs
 * Note: Only searches the primary keyword to avoid NVD rate limits and HTTP timeouts
 */
export async function scanAssetForCves(asset: Asset): Promise<CveSuggestion[]> {
    const db = await getDb();
    if (!db) {
        console.warn('[ThreatIntel] Database not available for scanning');
        return [];
    }

    const keywords = extractKeywordsFromAsset(asset);
    const suggestions: CveSuggestion[] = [];
    const seenCves = new Set<string>();

    // Only search the first (primary) keyword to avoid rate limit timeout
    // The primary keyword is the cleaned asset name - most relevant
    const primaryKeyword = keywords[0];
    if (!primaryKeyword) {
        console.warn('[ThreatIntel] No keyword extracted from asset');
        return [];
    }

    // Try to generate a CPE string if we have structured data
    let cpeName: string | undefined;
    if (asset.vendor && asset.productName) {
        cpeName = generateCpeString(asset.vendor, asset.productName, asset.version || undefined);
        console.log(`[ThreatIntel] Generated CPE for scanning: ${cpeName}`);
    }

    console.log(`[ThreatIntel] Scanning asset "${asset.name}" with keyword: "${primaryKeyword}" (CPE: ${cpeName || 'none'})`);

    // Use CPE search if available, otherwise keyword search
    const nvdResult = await searchNvdByKeyword(primaryKeyword, 50, cpeName); // Increased limit as CPE search is more precise
    if (!nvdResult?.vulnerabilities) {
        console.log('[ThreatIntel] No results from NVD');
        return [];
    }

    console.log(`[ThreatIntel] Found ${nvdResult.vulnerabilities.length} CVEs from NVD`);

    for (const vuln of nvdResult.vulnerabilities) {
        const cve = vuln.cve;
        if (seenCves.has(cve.id)) continue;
        seenCves.add(cve.id);

        // Cache the CVE data
        await cacheCveData(cve);

        // Check if in KEV
        const isKev = await isInKevCatalog(cve.id);

        const cvssV31 = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
        const cvssV2 = cve.metrics?.cvssMetricV2?.[0]?.cvssData;
        const cvssScore = cvssV31?.baseScore?.toString() || cvssV2?.baseScore?.toString() || null;

        // Extract CWE IDs
        const cweIds = cve.weaknesses?.flatMap(w =>
            w.description.filter(d => d.value.startsWith('CWE-')).map(d => d.value)
        ) || [];

        // Extract affected products
        const affectedProducts = cve.configurations?.flatMap((config: any) =>
            config.nodes.flatMap((node: any) =>
                node.cpeMatch?.filter((m: any) => m.vulnerable).map((m: any) => m.criteria) || []
            )
        ) || [];

        suggestions.push({
            cveId: cve.id,
            description: cve.descriptions.find(d => d.lang === 'en')?.value || cve.descriptions[0]?.value || '',
            cvssScore,
            isKev,
            matchScore: isKev ? 100 : (cpeName ? 90 : 80), // higher score for CPE + KEV
            matchReason: cpeName ? `Matched CPE: ${cpeName}` : `Matched keyword: "${primaryKeyword}"`,
            status: 'suggested',
            cweIds,
            references: cve.references || [],
            affectedProducts,
        });
    }

    // Sort by KEV status first, then CVSS score
    suggestions.sort((a, b) => {
        if (a.isKev !== b.isKev) return a.isKev ? -1 : 1;
        const scoreA = parseFloat(a.cvssScore || '0');
        const scoreB = parseFloat(b.cvssScore || '0');
        return scoreB - scoreA;
    });

    // Save matches to database
    for (const suggestion of suggestions.slice(0, 10)) { // Limit to top 10
        try {
            await db.insert(assetCveMatches)
                .values({
                    clientId: asset.clientId,
                    assetId: asset.id,
                    cveId: suggestion.cveId,
                    matchScore: suggestion.matchScore,
                    matchReason: suggestion.matchReason,
                    isKev: suggestion.isKev,
                    status: 'suggested',
                    discoveredAt: new Date(),
                })
                .onConflictDoNothing(); // Avoid duplicates
        } catch (e) {
            console.error('[ThreatIntel] Failed to save match:', e);
        }
    }

    return suggestions.slice(0, 20);
}

/**
 * Get existing CVE suggestions for an asset
 */
export async function getAssetCveSuggestions(assetId: number): Promise<CveSuggestion[]> {
    const db = await getDb();
    if (!db) return [];

    const matches = await db.select({
        match: assetCveMatches,
        cveCache: {
            description: nvdCveCache.description,
            cvssScore: nvdCveCache.cvssScore,
            cweIds: nvdCveCache.cweIds,
            references: nvdCveCache.references,
            affectedProducts: nvdCveCache.affectedProducts,
        }
    })
        .from(assetCveMatches)
        .leftJoin(nvdCveCache, eq(assetCveMatches.cveId, nvdCveCache.cveId))
        .where(eq(assetCveMatches.assetId, assetId));

    return matches.map((m: any) => ({
        cveId: m.match.cveId,
        description: m.cveCache?.description || '',
        cvssScore: m.cveCache?.cvssScore || null,
        isKev: m.match.isKev || false,
        matchScore: m.match.matchScore || 0,
        matchReason: m.match.matchReason || '',
        status: m.match.status || 'suggested',
        cweIds: (m.cveCache?.cweIds as string[] | undefined) || [],
        references: (m.cveCache?.references as { url: string; tags?: string[] }[] | undefined) || [],
        affectedProducts: (m.cveCache?.affectedProducts as string[] | undefined) || [],
    }));
}

/**
 * Scan all assets for a client
 */
export async function scanAllAssetsForClient(clientId: number): Promise<{ assetId: number; count: number }[]> {
    const db = await getDb();
    if (!db) return [];

    const clientAssets = await db.select()
        .from(assets)
        .where(eq(assets.clientId, clientId));

    const results: { assetId: number; count: number }[] = [];

    for (const asset of clientAssets) {
        const suggestions = await scanAssetForCves(asset);
        results.push({ assetId: asset.id, count: suggestions.length });
    }

    return results;
}

/**
 * Update match status (accept/dismiss)
 */
export async function updateMatchStatus(
    matchId: number,
    status: 'accepted' | 'dismissed' | 'imported',
    userId?: number
): Promise<void> {
    const db = await getDb();
    if (!db) return;

    await db.update(assetCveMatches)
        .set({
            status,
            reviewedAt: new Date(),
            reviewedBy: userId,
        })
        .where(eq(assetCveMatches.id, matchId));
}

// ==================== VENDOR SCANNING FUNCTIONS ====================

/**
 * Scan a single vendor for matching CVEs based on vendor name
 */
export async function scanVendorForCves(vendorId: number): Promise<CveSuggestion[]> {
    const db = await getDb();
    if (!db) {
        console.warn('[ThreatIntel] Database not available for scanning');
        return [];
    }

    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId));
    if (!vendor) {
        console.warn(`[ThreatIntel] Vendor ${vendorId} not found`);
        return [];
    }

    const suggestions: CveSuggestion[] = [];
    const seenCves = new Set<string>();

    // Search NVD for the vendor name
    // We clean the name to avoid issues with specialized characters
    const keyword = vendor.name.replace(/[^\w\s]/gi, '').trim();

    console.log(`[ThreatIntel] Scanning vendor "${vendor.name}" with keyword: "${keyword}"`);

    const nvdResult = await searchNvdByKeyword(keyword, 50);
    if (!nvdResult?.vulnerabilities) {
        console.log('[ThreatIntel] No results from NVD for vendor');
        return [];
    }

    console.log(`[ThreatIntel] Found ${nvdResult.vulnerabilities.length} CVEs from NVD for vendor`);

    for (const vuln of nvdResult.vulnerabilities) {
        const cve = vuln.cve;
        if (seenCves.has(cve.id)) continue;
        seenCves.add(cve.id);

        // Cache the CVE data
        await cacheCveData(cve);

        // Check if in KEV
        const isKev = await isInKevCatalog(cve.id);

        const cvssV31 = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
        const cvssV2 = cve.metrics?.cvssMetricV2?.[0]?.cvssData;
        const cvssScore = cvssV31?.baseScore?.toString() || cvssV2?.baseScore?.toString() || null;

        // Extract CWE IDs
        const cweIds = cve.weaknesses?.flatMap(w =>
            w.description.filter(d => d.value.startsWith('CWE-')).map(d => d.value)
        ) || [];

        // Extract affected products
        const affectedProducts = cve.configurations?.flatMap(config =>
            config.nodes.flatMap(node =>
                node.cpeMatch?.filter(m => m.vulnerable).map(m => m.criteria) || []
            )
        ) || [];

        suggestions.push({
            cveId: cve.id,
            description: cve.descriptions.find(d => d.lang === 'en')?.value || cve.descriptions[0]?.value || '',
            cvssScore,
            isKev,
            matchScore: isKev ? 100 : 85, // High confidence if searching by explicit vendor name
            matchReason: `Matched vendor name: "${keyword}"`,
            status: 'suggested',
            cweIds,
            references: cve.references || [],
            affectedProducts,
        });
    }

    // Sort by KEV status first, then CVSS score
    suggestions.sort((a, b) => {
        if (a.isKev !== b.isKev) return a.isKev ? -1 : 1;
        const scoreA = parseFloat(a.cvssScore || '0');
        const scoreB = parseFloat(b.cvssScore || '0');
        return scoreB - scoreA;
    });

    // Save matches to database
    for (const suggestion of suggestions.slice(0, 15)) { // Limit to top 15
        try {
            await db.insert(vendorCveMatches)
                .values({
                    vendorId: vendor.id,
                    cveId: suggestion.cveId,
                    matchScore: suggestion.matchScore,
                    matchReason: suggestion.matchReason,
                    status: 'Active',
                    discoveredAt: new Date(),
                })
                .onConflictDoNothing();
        } catch (e) {
            console.error('[ThreatIntel] Failed to save vendor match:', e);
        }
    }

    // Index for RAG - Removed for Core split
    // try {
    //     const { IndexingService } = await import('./advisor/indexing');
    //     // ... indexing logic ...
    // } catch (e) {
    //     console.error('[ThreatIntel] Failed to index vendor scan:', e);
    // }

    return suggestions.slice(0, 20);
}

/**
 * Get existing CVE suggestions for a vendor
 */
export async function getVendorCveSuggestions(vendorId: number): Promise<CveSuggestion[]> {
    const db = await getDb();
    if (!db) return [];

    const matches = await db.select({
        match: vendorCveMatches,
        cveCache: {
            description: nvdCveCache.description,
            cvssScore: nvdCveCache.cvssScore,
            cweIds: nvdCveCache.cweIds,
            references: nvdCveCache.references,
            affectedProducts: nvdCveCache.affectedProducts,
        }
    })
        .from(vendorCveMatches)
        .leftJoin(nvdCveCache, eq(vendorCveMatches.cveId, nvdCveCache.cveId))
        .where(eq(vendorCveMatches.vendorId, vendorId));

    return matches.map((m: any) => ({
        cveId: m.match.cveId,
        description: m.cveCache?.description || '',
        cvssScore: m.cveCache?.cvssScore || null,
        isKev: false, // Not stored in vendorCveMatches, could join if needed but expensive
        matchScore: m.match.matchScore || 0,
        matchReason: m.match.matchReason || '',
        status: m.match.status || 'Active',
        cweIds: (m.cveCache?.cweIds as string[] | undefined) || [],
        references: (m.cveCache?.references as { url: string; tags?: string[] }[] | undefined) || [],
        affectedProducts: (m.cveCache?.affectedProducts as string[] | undefined) || [],
    }));
}
/**
 * Known Verified Breaches Database
 * Populated with real historical data for demonstration purposes
 */
const KNOWN_BREACHES: Record<string, BreachSuggestion[]> = {
    'notion': [
        {
            title: "Access Token Phishing Campaign",
            description: "Attackers targeted Notion users with phishing emails to steal integration tokens, gaining unauthorized access to workspaces.",
            breachDate: new Date('2024-04-15'),
            recordCount: 0, // Targeted nature, count varies
            dataClasses: ['Integration Tokens', 'Workspace Content'],
            riskScore: 75,
            source: "Verified Security Repot",
            isVerified: true
        },
        {
            title: "AI Prompt Injection Vulnerability",
            description: "Researchers demonstrated how malicious documents could trigger prompt injection in Notion AI to exfiltrate data.",
            breachDate: new Date('2025-09-10'),
            recordCount: 0,
            dataClasses: ['Workspace Content', 'Private Notes'],
            riskScore: 60,
            source: "Security Research",
            isVerified: true
        }
    ],
    'zoom': [
        {
            title: "Credential Stuffing affecting 500k Accounts",
            description: "Over 500,000 Zoom accounts were compromised via credential stuffing and sold on the dark web.",
            breachDate: new Date('2020-04-01'),
            recordCount: 500000,
            dataClasses: ['Email Addresses', 'Passwords', 'Meeting URLs', 'Host Keys'],
            riskScore: 90,
            source: "Dark Web Monitoring",
            isVerified: true
        },
        {
            title: "Unauthorized Data Sharing",
            description: "Zoom iOS app was found to be sending analytics data to Facebook without explicit user consent.",
            breachDate: new Date('2020-03-20'),
            recordCount: 10000000,
            dataClasses: ['Device IDs', 'Location Data', 'Usage Stats'],
            riskScore: 40,
            source: "Privacy Audit",
            isVerified: true
        }
    ]
};

/**
 * Search for known verified breaches
 * Uses the local KNOWN_BREACHES database for "Real Truth" demo data
 */
export async function simulateBreachSearch(vendorName: string, domain?: string): Promise<BreachSuggestion[]> {
    const normalizedName = vendorName.toLowerCase().trim();

    // Check for exact or partial match in our known database
    for (const [key, breaches] of Object.entries(KNOWN_BREACHES)) {
        if (normalizedName.includes(key)) {
            console.log(`[ThreatIntel] Found known breaches for ${vendorName} (matched: ${key})`);
            return breaches;
        }
    }

    // No known breaches found for this vendor
    return [];
}
