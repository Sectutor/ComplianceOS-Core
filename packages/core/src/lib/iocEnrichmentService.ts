/**
 * IOC Enrichment Service
 * 
 * Provides enrichment capabilities for Indicators of Compromise (IOCs)
 * by integrating with external threat intelligence APIs.
 * 
 * Supported sources:
 * - VirusTotal (requires API key)
 * - AbuseIPDB (requires API key)
 * - Shodan (requires API key)
 * - IPinfo (requires API key)
 */

import { getDb } from '../db';
import { iocRecords, iocEnrichmentHistory } from '../schema';
import { sql } from 'drizzle-orm';

// Environment variable placeholders - would be loaded from process.env
const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;
const ABUSEIPDB_API_KEY = process.env.ABUSEIPDB_API_KEY;
const SHODAN_API_KEY = process.env.SHODAN_API_KEY;
const IPINFO_API_KEY = process.env.IPINFO_API_KEY;

// ==================== TYPES ====================

export interface EnrichmentResult {
    provider: string;
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
    enrichedAt: Date;
}

// ==================== VIRUSTOTAL ====================

/**
 * Enrich an IOC with VirusTotal data
 */
export async function enrichWithVirusTotal(indicator: string): Promise<EnrichmentResult> {
    if (!VIRUSTOTAL_API_KEY) {
        return {
            provider: 'virustotal',
            success: false,
            error: 'VirusTotal API key not configured',
            enrichedAt: new Date()
        };
    }

    try {
        // Determine endpoint based on indicator type
        let endpoint = 'https://www.virustotal.com/api/v3/ip_addresses';
        if (indicator.includes('.') && !indicator.includes('/')) {
            endpoint = 'https://www.virustotal.com/api/v3/ip_addresses';
        } else if (/^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/.test(indicator)) {
            endpoint = 'https://www.virustotal.com/api/v3/files';
        } else {
            endpoint = 'https://www.virustotal.com/api/v3/domains';
        }

        const response = await fetch(`${endpoint}/${encodeURIComponent(indicator)}`, {
            headers: {
                'x-apikey': VIRUSTOTAL_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return {
                    provider: 'virustotal',
                    success: true,
                    data: { not_found: true },
                    enrichedAt: new Date()
                };
            }
            throw new Error(`VT API error: ${response.status}`);
        }

        const data = await response.json();

        // Calculate reputation and extract key info
        const stats = data.data?.attributes?.last_analysis_stats || {};
        const malicious = stats.malicious || 0;
        const suspicious = stats.suspicious || 0;
        const reputation = Math.max(0, 100 - (malicious * 10) - (suspicious * 5));

        return {
            provider: 'virustotal',
            success: true,
            data: {
                reputation,
                malicious,
                suspicious,
                lastAnalysisStats: stats,
                tags: data.data?.attributes?.tags || []
            },
            enrichedAt: new Date()
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            provider: 'virustotal',
            success: false,
            error: message,
            enrichedAt: new Date()
        };
    }
}

// ==================== ABUSEIPDB ====================

/**
 * Enrich an IP address with AbuseIPDB data
 */
export async function enrichWithAbuseIPDB(ipAddress: string): Promise<EnrichmentResult> {
    if (!ABUSEIPDB_API_KEY) {
        return {
            provider: 'abuseipdb',
            success: false,
            error: 'AbuseIPDB API key not configured',
            enrichedAt: new Date()
        };
    }

    try {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ipAddress)) {
            return {
                provider: 'abuseipdb',
                success: false,
                error: 'AbuseIPDB only supports IP addresses',
                enrichedAt: new Date()
            };
        }

        const response = await fetch('https://api.abuseipdb.com/api/v2/check', {
            method: 'POST',
            headers: {
                'Key': ABUSEIPDB_API_KEY,
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'ipAddress': ipAddress,
                'maxAgeInDays': '90',
                'verbose': '',
                'includeReportedBy': 'true'
            })
        });

        if (!response.ok) {
            throw new Error(`AbuseIPDB API error: ${response.status}`);
        }

        const data = await response.json();

        const score = data.data?.abuseConfidenceScore || 0;
        const reputation = score >= 100 ? 'malicious' :
            score >= 50 ? 'suspicious' :
                score > 0 ? 'clean' : 'unknown';

        return {
            provider: 'abuseipdb',
            success: true,
            data: {
                abuseConfidenceScore: score,
                reputation,
                isWhitelisted: data.data?.isWhitelisted || false,
                countryCode: data.data?.countryCode,
                countryName: data.data?.countryName,
                isp: data.data?.isp,
                domain: data.data?.domain,
                totalReports: data.data?.totalReports,
                numDistinctUsers: data.data?.numDistinctUsers
            },
            enrichedAt: new Date()
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            provider: 'abuseipdb',
            success: false,
            error: message,
            enrichedAt: new Date()
        };
    }
}

// ==================== SHODAN ====================

/**
 * Enrich an IP address with Shodan data
 */
export async function enrichWithShodan(ipAddress: string): Promise<EnrichmentResult> {
    if (!SHODAN_API_KEY) {
        return {
            provider: 'shodan',
            success: false,
            error: 'Shodan API key not configured',
            enrichedAt: new Date()
        };
    }

    try {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ipAddress)) {
            return {
                provider: 'shodan',
                success: false,
                error: 'Shodan only supports IP addresses',
                enrichedAt: new Date()
            };
        }

        const response = await fetch(`https://api.shodan.io/shodan/host/${ipAddress}?key=${SHODAN_API_KEY}`);

        if (!response.ok) {
            if (response.status === 404) {
                return {
                    provider: 'shodan',
                    success: true,
                    data: { not_found: true },
                    enrichedAt: new Date()
                };
            }
            throw new Error(`Shodan API error: ${response.status}`);
        }

        const data = await response.json();
        const vulns = data.vulns || [];

        return {
            provider: 'shodan',
            success: true,
            data: {
                isp: data.isp,
                asn: data.asn,
                country_name: data.country_name,
                city: data.city,
                latitude: data.latitude,
                longitude: data.longitude,
                org: data.org,
                os: data.os,
                ports: data.ports || [],
                vulns,
                tags: data.tags || []
            },
            enrichedAt: new Date()
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            provider: 'shodan',
            success: false,
            error: message,
            enrichedAt: new Date()
        };
    }
}

// ==================== IPINFO ====================

/**
 * Enrich an IP address with IPInfo data
 */
export async function enrichWithIPInfo(ipAddress: string): Promise<EnrichmentResult> {
    if (!IPINFO_API_KEY) {
        return {
            provider: 'ipinfo',
            success: false,
            error: 'IPInfo API key not configured',
            enrichedAt: new Date()
        };
    }

    try {
        const response = await fetch(`https://ipinfo.io/${ipAddress}/json?token=${IPINFO_API_KEY}`);

        if (!response.ok) {
            if (response.status === 404) {
                return {
                    provider: 'ipinfo',
                    success: true,
                    data: { not_found: true },
                    enrichedAt: new Date()
                };
            }
            throw new Error(`IPInfo API error: ${response.status}`);
        }

        const data = await response.json();

        return {
            provider: 'ipinfo',
            success: true,
            data: {
                ip: data.ip,
                city: data.city,
                region: data.region,
                country: data.country,
                location: data.loc,
                org: data.org,
                postal: data.postal,
                timezone: data.timezone,
                asn: data.asn,
                hostname: data.hostname
            },
            enrichedAt: new Date()
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            provider: 'ipinfo',
            success: false,
            error: message,
            enrichedAt: new Date()
        };
    }
}

// ==================== UNIFIED ENRICHMENT ====================

/**
 * Enrich an IOC with all available sources
 */
export async function enrichIoc(iocId: number): Promise<{ success: boolean; results: EnrichmentResult[] }> {
    const db = await getDb();

    const [ioc] = await db.select()
        .from(iocRecords)
        .where(sql`${iocRecords.id} = ${iocId}`);

    if (!ioc) {
        return { success: false, results: [] };
    }

    const results: EnrichmentResult[] = [];

    if (ioc.type === 'ip') {
        const [vtResult, abuseResult, shodanResult, ipinfoResult] = await Promise.all([
            enrichWithVirusTotal(ioc.indicator),
            enrichWithAbuseIPDB(ioc.indicator),
            enrichWithShodan(ioc.indicator),
            enrichWithIPInfo(ioc.indicator)
        ]);

        results.push(vtResult, abuseResult, shodanResult, ipinfoResult);
    } else {
        const vtResult = await enrichWithVirusTotal(ioc.indicator);
        results.push(vtResult);
    }

    let maxMaliciousScore = 0;
    const combinedTags: string[] = [];

    for (const result of results) {
        if (result.success && result.data) {
            if (result.provider === 'virustotal' && typeof result.data.malicious === 'number') {
                maxMaliciousScore = Math.max(maxMaliciousScore, result.data.malicious);
            }
            if (result.provider === 'abuseipdb' && typeof result.data.abuseConfidenceScore === 'number') {
                maxMaliciousScore = Math.max(maxMaliciousScore, result.data.abuseConfidenceScore);
            }
            if (Array.isArray(result.data.tags)) {
                combinedTags.push(...result.data.tags.filter((t): t is string => typeof t === 'string'));
            }
        }
    }

    let finalReputation: string;
    let finalConfidence: number;

    if (maxMaliciousScore >= 80) {
        finalReputation = 'malicious';
        finalConfidence = Math.min(100, 50 + maxMaliciousScore / 2);
    } else if (maxMaliciousScore >= 30) {
        finalReputation = 'suspicious';
        finalConfidence = Math.min(100, 30 + maxMaliciousScore);
    } else if (maxMaliciousScore > 0) {
        finalReputation = 'clean';
        finalConfidence = Math.min(100, 30 + maxMaliciousScore);
    } else {
        finalReputation = 'unknown';
        finalConfidence = 0;
    }

    await db.update(iocRecords)
        .set({
            reputation: finalReputation,
            confidence: finalConfidence,
            enrichment: {
                lastEnrichment: new Date().toISOString(),
                providers: results.map(r => ({
                    provider: r.provider,
                    success: r.success,
                    data: r.data
                }))
            },
            tags: [...new Set([...(ioc.tags || []), ...combinedTags])],
            lastEnriched: new Date(),
            updatedAt: new Date()
        })
        .where(sql`${iocRecords.id} = ${iocId}`);

    for (const result of results) {
        await db.insert(iocEnrichmentHistory).values({
            iocId,
            provider: result.provider,
            result: result.data
        });
    }

    return { success: true, results };
}

// ==================== BULK ENRICHMENT ====================

/**
 * Enrich all IOCs for a client
 */
export async function enrichClientIocs(clientId: number): Promise<{ success: boolean; processed: number; errors: number }> {
    const db = await getDb();

    const iocs = await db.select()
        .from(iocRecords)
        .where(sql`
            ${iocRecords.clientId} = ${clientId} 
            AND (
                ${iocRecords.lastEnriched} IS NULL 
                OR ${iocRecords.lastEnriched} < NOW() - INTERVAL '24 hours'
            )
            AND ${iocRecords.status} = 'active'
        `);

    let processed = 0;
    let errors = 0;

    for (const ioc of iocs) {
        try {
            await enrichIoc(ioc.id);
            processed++;
        } catch (error) {
            console.error(`Failed to enrich IOC ${ioc.id}:`, error);
            errors++;
        }
    }

    return { success: true, processed, errors };
}
