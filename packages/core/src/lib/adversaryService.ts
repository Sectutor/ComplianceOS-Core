/**
 * Adversary Intelligence Service
 * 
 * Premium feature that integrates MITRE ATT&CK framework and external security feeds
 * to provide live threat intelligence directly in the Risk Management workflow.
 */

import crypto from 'crypto';

// ==================== TYPE DEFINITIONS ====================

export interface MitreTactic {
    id: string;
    name: string;
    shortname: string;
    description: string;
    url: string;
}

export interface MitreTechnique {
    id: string;
    name: string;
    description: string;
    tacticId: string;
    tacticName: string;
    url: string;
    mitigations: MitreMitigation[];
    platforms: string[];
    dataSources: string[];
    isSubtechnique: boolean;
    parentId?: string;
}

export interface MitreMitigation {
    id: string;
    name: string;
    description: string;
    url: string;
}

export interface SecurityFeedItem {
    id: string;
    title: string;
    description: string;
    link: string;
    pubDate: Date;
    source: 'cisa_kev' | 'hacker_news' | 'bleeping_computer' | 'cisa_alerts';
    sourceName: string;
    category?: string;
    severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
    cveIds?: string[];
    tags?: string[];
    techStack?: string[]; // New field for tech stack matching
}

// ... (keep generic constants)

// Tech Keywords for Contextual Intelligence
const TECH_KEYWORDS = {
    os: ['windows', 'linux', 'macos', 'android', 'ios', 'ubuntu', 'debian', 'centos', 'redhat', 'rhel'],
    cloud: ['aws', 'azure', 'gcp', 'google cloud', 'kubernetes', 'docker', 'openshift', 'cloudflare'],
    db: ['postgresql', 'mysql', 'mongodb', 'redis', 'oracle', 'sql server', 'sqlite', 'elasticsearch'],
    lang: ['python', 'javascript', 'typescript', 'java', 'golang', 'rust', 'php', 'ruby', 'c++', 'c#'],
    web: ['react', 'vue', 'angular', 'node.js', 'express', 'django', 'flask', 'spring', 'asp.net', 'laravel', 'wordpress', 'drupal'],
    vendor: ['microsoft', 'apple', 'google', 'amazon', 'adobe', 'cisco', 'fortinet', 'palo alto', 'ivanti', 'citrix', 'vmware', 'salesforce', 'slack', 'zoom']
};

/**
 * Extract Technology Stack tags from text
 */
function extractTechStack(text: string): string[] {
    const found: Set<string> = new Set();
    const lowerText = text.toLowerCase();

    for (const category of Object.values(TECH_KEYWORDS)) {
        for (const keyword of category) {
            // Use word boundary check to avoid partial matches (e.g. "java" in "javascript" is handled by order or strict check)
            // Simple includes check is fast but might have false positives (e.g. "os" in "cost")
            // Let's use specific regex for common short words, includes for distinct ones.

            if (keyword.length <= 3) {
                // Escape special regex characters like + in c++
                const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escaped}\\b`, 'i');
                if (regex.test(text)) found.add(keyword);
            } else {
                if (lowerText.includes(keyword)) found.add(keyword);
            }
        }
    }
    return Array.from(found);
}

/**
 * Extract relevant security tags from text
 */
function extractTags(text: string): string[] {
    const tags: Set<string> = new Set();
    const lowerText = text.toLowerCase();

    const tagKeywords = [
        'ransomware', 'phishing', 'malware', 'vulnerability', 'exploit',
        'zero-day', 'apt', 'data breach', 'ddos', 'supply chain',
        'authentication', 'encryption', 'backdoor', 'botnet', 'trojan',
        'spyware', 'worm', 'rootkit', 'keylogger', 'credential theft',
        'social engineering', 'insider threat', 'remote code execution', 'rce', 'xss', 'sql injection'
    ];

    for (const keyword of tagKeywords) {
        if (lowerText.includes(keyword)) {
            tags.add(keyword);
        }
    }

    return Array.from(tags).slice(0, 10);
}

export interface MitreAttackData {
    tactics: MitreTactic[];
    techniques: MitreTechnique[];
    mitigations: MitreMitigation[];
    lastUpdated: Date;
}

// ==================== CONSTANTS ====================

const MITRE_ATTACK_URL = 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json';
const CISA_ALERTS_RSS = 'https://www.cisa.gov/cybersecurity-advisories/all.xml';
const HACKER_NEWS_RSS = 'https://feeds.feedburner.com/TheHackersNews';
const BLEEPING_COMPUTER_RSS = 'https://www.bleepingcomputer.com/feed/';

// In-memory cache for performance
let mitreCache: MitreAttackData | null = null;
let mitreCacheExpiry: Date | null = null;
let feedCache: Map<string, { items: SecurityFeedItem[], expiry: Date }> = new Map();

const MITRE_CACHE_HOURS = 24; // Cache MITRE data for 24 hours
const FEED_CACHE_MINUTES = 30; // Cache feeds for 30 minutes

// ==================== MITRE ATT&CK FUNCTIONS ====================

interface StixObject {
    type: string;
    id: string;
    name?: string;
    description?: string;
    external_references?: Array<{
        source_name: string;
        external_id?: string;
        url?: string;
    }>;
    x_mitre_shortname?: string;
    kill_chain_phases?: Array<{
        kill_chain_name: string;
        phase_name: string;
    }>;
    x_mitre_platforms?: string[];
    x_mitre_data_sources?: string[];
    x_mitre_is_subtechnique?: boolean;
    relationship_type?: string;
    source_ref?: string;
    target_ref?: string;
}

interface StixBundle {
    objects: StixObject[];
}

/**
 * Fetch and parse the MITRE ATT&CK Enterprise Matrix
 */
export async function fetchMitreAttackData(): Promise<MitreAttackData> {
    // Check cache first
    if (mitreCache && mitreCacheExpiry && new Date() < mitreCacheExpiry) {
        console.log('[AdversaryIntel] Returning cached MITRE ATT&CK data');
        return mitreCache;
    }

    console.log('[AdversaryIntel] Fetching fresh MITRE ATT&CK data...');

    try {
        const response = await fetch(MITRE_ATTACK_URL, {
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`MITRE ATT&CK fetch failed: ${response.status}`);
        }

        const stixBundle: StixBundle = await response.json();

        // Parse STIX bundle into our format
        const tactics: MitreTactic[] = [];
        const techniques: MitreTechnique[] = [];
        const mitigations: MitreMitigation[] = [];
        const tacticMap = new Map<string, MitreTactic>();
        const mitigationMap = new Map<string, MitreMitigation>();
        const techniqueToMitigations = new Map<string, string[]>();

        // First pass: extract tactics and mitigations
        for (const obj of stixBundle.objects) {
            if (obj.type === 'x-mitre-tactic') {
                const externalId = obj.external_references?.find(r => r.source_name === 'mitre-attack')?.external_id;
                const url = obj.external_references?.find(r => r.source_name === 'mitre-attack')?.url;

                if (externalId) {
                    const tactic: MitreTactic = {
                        id: externalId,
                        name: obj.name || '',
                        shortname: obj.x_mitre_shortname || '',
                        description: obj.description || '',
                        url: url || `https://attack.mitre.org/tactics/${externalId}/`,
                    };
                    tactics.push(tactic);
                    tacticMap.set(obj.x_mitre_shortname || '', tactic);
                }
            }

            if (obj.type === 'course-of-action') {
                const externalId = obj.external_references?.find(r => r.source_name === 'mitre-attack')?.external_id;
                const url = obj.external_references?.find(r => r.source_name === 'mitre-attack')?.url;

                if (externalId) {
                    const mitigation: MitreMitigation = {
                        id: externalId,
                        name: obj.name || '',
                        description: obj.description || '',
                        url: url || `https://attack.mitre.org/mitigations/${externalId}/`,
                    };
                    mitigations.push(mitigation);
                    mitigationMap.set(obj.id, mitigation);
                }
            }
        }

        // Second pass: extract relationships (technique -> mitigation)
        for (const obj of stixBundle.objects) {
            if (obj.type === 'relationship' && obj.relationship_type === 'mitigates') {
                const targetRef = obj.target_ref;
                const sourceRef = obj.source_ref;
                if (targetRef && sourceRef) {
                    if (!techniqueToMitigations.has(targetRef)) {
                        techniqueToMitigations.set(targetRef, []);
                    }
                    techniqueToMitigations.get(targetRef)!.push(sourceRef);
                }
            }
        }

        // Third pass: extract techniques
        for (const obj of stixBundle.objects) {
            if (obj.type === 'attack-pattern') {
                const externalId = obj.external_references?.find(r => r.source_name === 'mitre-attack')?.external_id;
                const url = obj.external_references?.find(r => r.source_name === 'mitre-attack')?.url;
                const killChain = obj.kill_chain_phases?.find(k => k.kill_chain_name === 'mitre-attack');

                if (externalId && killChain) {
                    const tactic = tacticMap.get(killChain.phase_name);

                    // Get mitigations for this technique
                    const mitigationRefs = techniqueToMitigations.get(obj.id) || [];
                    const techniqueMitigations = mitigationRefs
                        .map(ref => mitigationMap.get(ref))
                        .filter((m): m is MitreMitigation => m !== undefined);

                    const technique: MitreTechnique = {
                        id: externalId,
                        name: obj.name || '',
                        description: obj.description || '',
                        tacticId: tactic?.id || '',
                        tacticName: tactic?.name || killChain.phase_name,
                        url: url || `https://attack.mitre.org/techniques/${externalId.replace('.', '/')}/`,
                        mitigations: techniqueMitigations,
                        platforms: obj.x_mitre_platforms || [],
                        dataSources: obj.x_mitre_data_sources || [],
                        isSubtechnique: obj.x_mitre_is_subtechnique || false,
                        parentId: obj.x_mitre_is_subtechnique ? externalId.split('.')[0] : undefined,
                    };
                    techniques.push(technique);
                }
            }
        }

        // Sort tactics and techniques
        tactics.sort((a, b) => a.id.localeCompare(b.id));
        techniques.sort((a, b) => a.id.localeCompare(b.id));

        const data: MitreAttackData = {
            tactics,
            techniques,
            mitigations,
            lastUpdated: new Date(),
        };

        // Update cache
        mitreCache = data;
        mitreCacheExpiry = new Date();
        mitreCacheExpiry.setHours(mitreCacheExpiry.getHours() + MITRE_CACHE_HOURS);

        console.log(`[AdversaryIntel] Loaded ${tactics.length} tactics, ${techniques.length} techniques, ${mitigations.length} mitigations`);

        return data;
    } catch (error) {
        console.error('[AdversaryIntel] Failed to fetch MITRE ATT&CK data:', error);

        // Return empty data if cache is unavailable
        if (mitreCache) {
            console.log('[AdversaryIntel] Returning stale cached data');
            return mitreCache;
        }

        return {
            tactics: [],
            techniques: [],
            mitigations: [],
            lastUpdated: new Date(),
        };
    }
}

/**
 * Search MITRE techniques by keyword
 */
export async function searchMitreTechniques(query: string, limit: number = 20): Promise<MitreTechnique[]> {
    const data = await fetchMitreAttackData();
    const lowerQuery = query.toLowerCase();

    const results = data.techniques.filter(t =>
        t.id.toLowerCase().includes(lowerQuery) ||
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tacticName.toLowerCase().includes(lowerQuery)
    );

    return results.slice(0, limit);
}

/**
 * Get a specific technique by ID
 */
export async function getMitreTechniqueById(id: string): Promise<MitreTechnique | null> {
    const data = await fetchMitreAttackData();
    return data.techniques.find(t => t.id === id) || null;
}

/**
 * Get all techniques for a specific tactic
 */
export async function getTechniquesByTactic(tacticId: string): Promise<MitreTechnique[]> {
    const data = await fetchMitreAttackData();
    return data.techniques.filter(t => t.tacticId === tacticId);
}

// ==================== RSS FEED FUNCTIONS ====================

/**
 * Parse XML RSS/Atom feed into SecurityFeedItems
 */
function parseRssFeed(xmlText: string, source: SecurityFeedItem['source'], sourceName: string): SecurityFeedItem[] {
    const items: SecurityFeedItem[] = [];

    // Simple XML parsing - in production you'd use a proper XML parser
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    const matches = xmlText.matchAll(itemRegex);

    for (const match of matches) {
        const itemXml = match[1];

        const title = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || '';
        const description = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() || '';
        const link = itemXml.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim() || '';
        const pubDateStr = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim();
        const category = itemXml.match(/<category>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/i)?.[1]?.trim();

        // Extract CVE IDs from title and description
        const cvePattern = /CVE-\d{4}-\d+/gi;
        const cveIds = [...new Set([
            ...(title.match(cvePattern) || []),
            ...(description.match(cvePattern) || [])
        ])];

        // Determine severity based on keywords
        let severity: SecurityFeedItem['severity'] = 'info';
        const text = (title + ' ' + description).toLowerCase();
        if (text.includes('critical') || text.includes('emergency') || text.includes('zero-day')) {
            severity = 'critical';
        } else if (text.includes('high') || text.includes('severe') || text.includes('exploit')) {
            severity = 'high';
        } else if (text.includes('medium') || text.includes('moderate')) {
            severity = 'medium';
        } else if (text.includes('low') || text.includes('minor')) {
            severity = 'low';
        }

        // Generate unique ID using hash of link, title, and date
        const uniqueString = (link || '') + (title || '') + (pubDateStr || '');
        const hash = crypto.createHash('sha256').update(uniqueString).digest('hex').slice(0, 16);
        const id = `${source}-${hash}`;

        items.push({
            id,
            title: cleanHtml(title),
            description: cleanHtml(description).slice(0, 500),
            link,
            pubDate: pubDateStr ? new Date(pubDateStr) : new Date(),
            source,
            sourceName,
            category,
            severity,
            cveIds: cveIds.length > 0 ? cveIds : undefined,
            tags: extractTags(title + ' ' + description),
            techStack: extractTechStack(title + ' ' + description),
        });
    }

    return items;
}

/**
 * Helper to decode HTML entities
 */
function decodeEntities(text: string): string {
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ');
}

/**
 * Clean HTML tags from text
 */
function cleanHtml(text: string): string {
    if (!text) return '';

    let content = text;

    // 1. Iteratively decode entities (handle double/triple encoding)
    // We loop up to 3 times to be safe
    for (let i = 0; i < 3; i++) {
        if (!content.includes('&')) break;
        const decoded = decodeEntities(content);
        if (decoded === content) break;
        content = decoded;
    }

    // 2. Remove CISA specific noise PATTERNS (including the tags)
    // Remove "View CSAF" link paragraph entirely: <p>...View CSAF...</p>
    content = content.replace(/<p>.*?View CSAF.*?<\/p>/gi, '');
    content = content.replace(/View CSAF/gi, ''); // Fallback

    // Remove "Summary" header and the "Summary" label
    content = content.replace(/<h[1-6]>.*?Summary.*?<\/h[1-6]>/gi, '');
    content = content.replace(/<strong>Summary<\/strong>/gi, '');

    // 3. Strip all remaining HTML tags
    content = content.replace(/<[^>]*>/g, ' ');

    // 4. Clean up whitespace
    return content.replace(/\s+/g, ' ').trim();
}



/**
 * Fetch security news from a single RSS feed
 */
async function fetchRssFeed(url: string, source: SecurityFeedItem['source'], sourceName: string): Promise<SecurityFeedItem[]> {
    const cacheKey = source;
    const cached = feedCache.get(cacheKey);

    if (cached && new Date() < cached.expiry) {
        return cached.items;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/rss+xml, application/xml, text/xml',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`[AdversaryIntel] Failed to fetch ${sourceName}: ${response.status}`);
            return cached?.items || [];
        }

        const xmlText = await response.text();
        const items = parseRssFeed(xmlText, source, sourceName);

        // Update cache
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + FEED_CACHE_MINUTES);
        feedCache.set(cacheKey, { items, expiry });

        console.log(`[AdversaryIntel] Fetched ${items.length} items from ${sourceName}`);
        return items;
    } catch (error) {
        console.error(`[AdversaryIntel] Error fetching ${sourceName}:`, error);
        return cached?.items || [];
    }
}

/**
 * Fetch and aggregate security news from all configured feeds
 */
export async function fetchSecurityFeeds(limit: number = 50): Promise<SecurityFeedItem[]> {
    console.log('[AdversaryIntel] Fetching security feeds...');

    const feedPromises = [
        fetchRssFeed(CISA_ALERTS_RSS, 'cisa_alerts', 'CISA Advisories'),
        fetchRssFeed(HACKER_NEWS_RSS, 'hacker_news', 'The Hacker News'),
        fetchRssFeed(BLEEPING_COMPUTER_RSS, 'bleeping_computer', 'Bleeping Computer'),
    ];

    const results = await Promise.allSettled(feedPromises);

    const allItems: SecurityFeedItem[] = [];
    for (const result of results) {
        if (result.status === 'fulfilled') {
            allItems.push(...result.value);
        }
    }

    // Sort by date (newest first) and limit
    allItems.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

    console.log(`[AdversaryIntel] Aggregated ${allItems.length} total feed items`);
    return allItems.slice(0, limit);
}

/**
 * Search security feeds by keyword
 */
export async function searchSecurityFeeds(query: string, limit: number = 20): Promise<SecurityFeedItem[]> {
    const allItems = await fetchSecurityFeeds(100);
    const lowerQuery = query.toLowerCase();

    const results = allItems.filter(item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.tags?.some(tag => tag.includes(lowerQuery)) ||
        item.cveIds?.some(cve => cve.toLowerCase().includes(lowerQuery))
    );

    return results.slice(0, limit);
}

// ==================== INTEGRATION FUNCTIONS ====================

/**
 * Create a risk draft from a security feed item
 */
export function createRiskFromFeedItem(item: SecurityFeedItem): {
    name: string;
    description: string;
    category: string;
    threatSource: string;
    potentialImpact: string;
    suggestedLikelihood: number;
    suggestedImpact: number;
    references: string[];
    cveIds?: string[];
} {
    // Map severity to suggested scores
    const severityToScore: Record<string, { likelihood: number; impact: number }> = {
        critical: { likelihood: 4, impact: 5 },
        high: { likelihood: 4, impact: 4 },
        medium: { likelihood: 3, impact: 3 },
        low: { likelihood: 2, impact: 2 },
        info: { likelihood: 1, impact: 1 },
    };

    const scores = severityToScore[item.severity || 'info'];

    return {
        name: `[${item.sourceName}] ${item.title.slice(0, 100)}`,
        description: `**Source:** ${item.sourceName}\n**Published:** ${item.pubDate.toISOString()}\n\n${item.description}\n\n**Original Article:** ${item.link}`,
        category: item.tags?.[0] || 'External Threat',
        threatSource: item.sourceName,
        potentialImpact: item.severity === 'critical' || item.severity === 'high'
            ? 'Potential significant business disruption, data breach, or financial loss'
            : 'Potential security incident requiring attention',
        suggestedLikelihood: scores.likelihood,
        suggestedImpact: scores.impact,
        references: [item.link],
        cveIds: item.cveIds,
    };
}

/**
 * Create a risk draft from a MITRE technique
 */
export function createRiskFromMitreTechnique(technique: MitreTechnique): {
    name: string;
    description: string;
    category: string;
    threatSource: string;
    mitigations: string[];
    mitreId: string;
    mitreTactic: string;
    references: string[];
} {
    return {
        name: `[${technique.id}] ${technique.name}`,
        description: `**MITRE ATT&CK Technique**\n\n**ID:** ${technique.id}\n**Tactic:** ${technique.tacticName}\n**Platforms:** ${technique.platforms.join(', ')}\n\n${technique.description}`,
        category: technique.tacticName,
        threatSource: 'MITRE ATT&CK Framework',
        mitigations: technique.mitigations.map(m => `${m.id}: ${m.name}`),
        mitreId: technique.id,
        mitreTactic: technique.tacticName,
        references: [technique.url],
    };
}

/**
 * Get intelligence summary for dashboard
 */
export async function getIntelligenceSummary(): Promise<{
    feedItems: number;
    criticalItems: number;
    highItems: number;
    tactics: number;
    techniques: number;
    recentCves: string[];
    topTags: { tag: string; count: number }[];
}> {
    const [feeds, mitre] = await Promise.all([
        fetchSecurityFeeds(100),
        fetchMitreAttackData(),
    ]);

    const tagCounts = new Map<string, number>();
    const recentCves: Set<string> = new Set();

    for (const item of feeds) {
        item.tags?.forEach(tag => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
        item.cveIds?.forEach(cve => recentCves.add(cve));
    }

    const topTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));

    return {
        feedItems: feeds.length,
        criticalItems: feeds.filter(f => f.severity === 'critical').length,
        highItems: feeds.filter(f => f.severity === 'high').length,
        tactics: mitre.tactics.length,
        techniques: mitre.techniques.length,
        recentCves: Array.from(recentCves).slice(0, 10),
        topTags,
    };
}

/**
 * Clear all caches (useful for testing or manual refresh)
 */
export function clearCaches(): void {
    mitreCache = null;
    mitreCacheExpiry = null;
    feedCache.clear();
    console.log('[AdversaryIntel] All caches cleared');
}
