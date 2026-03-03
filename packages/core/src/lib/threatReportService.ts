/**
 * Threat Intelligence Report Service
 * 
 * Generates automated threat intelligence reports in HTML format.
 * Reports can be viewed in browser and printed to PDF.
 */

import * as adversaryService from './adversaryService';

export interface ReportOptions {
    clientName: string;
    dateFrom?: Date;
    dateTo?: Date;
    includeFeeds: boolean;
    includeMitre: boolean;
    includeGroups: boolean;
    includeCves: boolean;
    severityFilter?: ('critical' | 'high' | 'medium' | 'low')[];
}

export interface GeneratedReport {
    title: string;
    generatedAt: Date;
    clientName: string;
    html: string;
    summary: ReportSummary;
}

export interface ReportSummary {
    totalFeeds: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    cveCount: number;
    mitreTechniques: number;
    threatGroups: number;
}

/**
 * Generate an HTML threat intelligence report
 */
export async function generateThreatReport(
    clientId: number,
    clientName: string,
    options: Partial<ReportOptions> = {}
): Promise<GeneratedReport> {
    const opts: ReportOptions = {
        clientName,
        includeFeeds: true,
        includeMitre: true,
        includeGroups: true,
        includeCves: true,
        ...options
    };

    // Gather data
    const [feeds, mitreData, groups] = await Promise.all([
        opts.includeFeeds ? adversaryService.fetchSecurityFeeds(100) : Promise.resolve([]),
        opts.includeMitre ? adversaryService.fetchMitreAttackData() : Promise.resolve({ tactics: [], techniques: [], mitigations: [], lastUpdated: new Date() }),
        opts.includeGroups ? adversaryService.fetchMitreGroups() : Promise.resolve([]),
    ]);

    // Calculate summary
    const criticalCount = feeds.filter((f: any) => f.severity === 'critical').length;
    const highCount = feeds.filter((f: any) => f.severity === 'high').length;
    const mediumCount = feeds.filter((f: any) => f.severity === 'medium').length;
    const lowCount = feeds.filter((f: any) => f.severity === 'low').length;

    const allCves = new Set<string>();
    feeds.forEach((f: any) => {
        if (f.cveIds) {
            f.cveIds.forEach((cve: string) => allCves.add(cve));
        }
    });

    const summary: ReportSummary = {
        totalFeeds: feeds.length,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        cveCount: allCves.size,
        mitreTechniques: mitreData.techniques.length,
        threatGroups: groups.length,
    };

    // Generate HTML
    const html = generateHtmlReport(opts, feeds, mitreData, groups, summary);

    return {
        title: `Threat Intelligence Report - ${clientName}`,
        generatedAt: new Date(),
        clientName,
        html,
        summary,
    };
}

/**
 * Generate HTML report content
 */
function generateHtmlReport(
    options: ReportOptions,
    feeds: any[],
    mitreData: any,
    groups: any[],
    summary: ReportSummary
): string {
    const now = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Threat Intelligence Report - ${options.clientName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            color: #1a1a1a; 
            background: #fff;
            padding: 40px;
            max-width: 900px;
            margin: 0 auto;
        }
        .header {
            border-bottom: 3px solid #dc2626;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 28px;
            color: #1a1a1a;
            margin-bottom: 8px;
        }
        .header .meta {
            color: #6b7280;
            font-size: 14px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: #f9fafb;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
        }
        .summary-card.critical { background: #fef2f2; border: 1px solid #fecaca; }
        .summary-card.high { background: #fff7ed; border: 1px solid #fed7aa; }
        .summary-card .number {
            font-size: 32px;
            font-weight: bold;
        }
        .summary-card.critical .number { color: #dc2626; }
        .summary-card.high .number { color: #ea580c; }
        .summary-card .label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        h2 {
            font-size: 20px;
            color: #1a1a1a;
            margin: 30px 0 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        .feed-item {
            padding: 16px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 12px;
        }
        .feed-item.critical { border-left: 4px solid #dc2626; }
        .feed-item.high { border-left: 4px solid #ea580c; }
        .feed-item .title {
            font-weight: 600;
            margin-bottom: 4px;
        }
        .feed-item .meta {
            font-size: 12px;
            color: #6b7280;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .badge.critical { background: #fef2f2; color: #dc2626; }
        .badge.high { background: #fff7ed; color: #ea580c; }
        .badge.medium { background: #fefce8; color: #ca8a04; }
        .badge.low { background: #eff6ff; color: #2563eb; }
        .cve-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
        }
        .cve {
            font-family: monospace;
            font-size: 12px;
            background: #f3f4f6;
            padding: 4px 8px;
            border-radius: 4px;
        }
        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 8px;
        }
        .tag {
            font-size: 11px;
            background: #e5e7eb;
            padding: 2px 6px;
            border-radius: 3px;
        }
        .technique-list {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        .technique {
            background: #f9fafb;
            padding: 12px;
            border-radius: 6px;
        }
        .technique .id {
            font-family: monospace;
            font-size: 12px;
            color: #6b7280;
        }
        .technique .name {
            font-weight: 600;
            margin: 4px 0;
        }
        .group-list {
            display: grid;
            gap: 12px;
        }
        .group {
            background: #f9fafb;
            padding: 16px;
            border-radius: 8px;
        }
        .group .alias {
            font-size: 12px;
            color: #6b7280;
            font-style: italic;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
        }
        @media print {
            body { padding: 20px; }
            .summary-grid { grid-template-columns: repeat(2, 1fr); }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ Threat Intelligence Report</h1>
        <div class="meta">
            <strong>Client:</strong> ${options.clientName} | 
            <strong>Generated:</strong> ${now} | 
            <strong>Report Type:</strong> Executive Summary
        </div>
    </div>

    <div class="summary-grid">
        <div class="summary-card critical">
            <div class="number">${summary.criticalCount}</div>
            <div class="label">Critical</div>
        </div>
        <div class="summary-card high">
            <div class="number">${summary.highCount}</div>
            <div class="label">High</div>
        </div>
        <div class="summary-card">
            <div class="number">${summary.mediumCount}</div>
            <div class="label">Medium</div>
        </div>
        <div class="summary-card">
            <div class="number">${summary.cveCount}</div>
            <div class="label">CVEs</div>
        </div>
    </div>

    ${options.includeFeeds ? `
    <h2>📰 Latest Threat Intelligence</h2>
    ${feeds.slice(0, 15).map(feed => `
        <div class="feed-item ${feed.severity || ''}">
            <div class="title">${feed.title}</div>
            <div class="meta">
                <span class="badge ${feed.severity || 'low'}">${feed.severity || 'info'}</span>
                <span>${feed.sourceName}</span> | 
                <span>${new Date(feed.pubDate).toLocaleDateString()}</span>
            </div>
            ${feed.cveIds && feed.cveIds.length > 0 ? `
                <div class="cve-list">
                    ${feed.cveIds.map(cve => `<span class="cve">${cve}</span>`).join('')}
                </div>
            ` : ''}
            ${feed.tags && feed.tags.length > 0 ? `
                <div class="tags">
                    ${feed.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `).join('')}
    ` : ''}

    ${options.includeMitre ? `
    <h2>🎯 MITRE ATT&CK Techniques</h2>
    <div class="technique-list">
        ${mitreData.techniques.slice(0, 20).map(tech => `
            <div class="technique">
                <div class="id">${tech.id}</div>
                <div class="name">${tech.name}</div>
                <div class="meta">${tech.tacticName}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${options.includeGroups ? `
    <h2>👤 Threat Actor Groups</h2>
    <div class="group-list">
        ${groups.slice(0, 10).map(group => `
            <div class="group">
                <div class="name"><strong>${group.name}</strong> (${group.id})</div>
                ${group.alias && group.alias.length > 0 ? `
                    <div class="alias">aka: ${group.alias.slice(0, 3).join(', ')}</div>
                ` : ''}
                <div class="meta">${group.techniques?.length || 0} techniques | ${group.software?.length || 0} tools</div>
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="footer">
        <p>Generated by ComplianceOS Threat Intelligence | ${now}</p>
        <p>This report is for informational purposes only and should be used as part of a comprehensive security program.</p>
    </div>
</body>
</html>`;
}

/**
 * Generate a simple text summary for email/digest
 */
export function generateThreatDigest(
    clientName: string,
    feeds: any[],
    summary: ReportSummary
): string {
    const criticalItems = feeds.filter((f: any) => f.severity === 'critical').slice(0, 5);

    let digest = `THREAT INTELLIGENCE DIGEST
========================
Client: ${clientName}
Date: ${new Date().toLocaleDateString()}

SUMMARY
-------
Critical: ${summary.criticalCount}
High: ${summary.highCount}
CVEs Identified: ${summary.cveCount}

`;

    if (criticalItems.length > 0) {
        digest += `CRITICAL THREATS
---------------
`;
        criticalItems.forEach((item: any, idx: number) => {
            digest += `${idx + 1}. ${item.title}
   Source: ${item.sourceName} | ${new Date(item.pubDate).toLocaleDateString()}
   ${item.cveIds ? 'CVEs: ' + item.cveIds.join(', ') : ''}
   
`;
        });
    }

    digest += `
---
Generated by ComplianceOS Threat Intelligence
`;

    return digest;
}
