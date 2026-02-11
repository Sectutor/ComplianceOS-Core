/**
 * Threat Intelligence Panel
 * 
 * Displays CVE suggestions from NVD and CISA KEV for an asset.
 * Allows users to review, dismiss, or import suggestions as vulnerabilities.
 */

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@complianceos/ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import {
    Shield,
    AlertTriangle,
    RefreshCw,
    ExternalLink,
    Check,
    X,
    Import,
    Loader2,
    Zap,
    AlertCircle,
    Info,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

interface ThreatIntelPanelProps {
    clientId: number;
    assetId: number;
    assetName: string;
    assetVendor?: string | null;
    assetProduct?: string | null;
    onVulnerabilityImported?: () => void;
}

export function ThreatIntelPanel({
    clientId,
    assetId,
    assetName,
    assetVendor,
    assetProduct,
    onVulnerabilityImported
}: ThreatIntelPanelProps) {
    const [isScanning, setIsScanning] = useState(false);

    // Fetch existing suggestions
    const { data: suggestions, refetch, isLoading } = trpc.threatIntel.getAssetSuggestions.useQuery(
        { assetId },
        { enabled: !!assetId }
    );

    // Scan mutation
    const scanMutation = trpc.threatIntel.scanAsset.useMutation({
        onSuccess: (data) => {
            toast.success(`Found ${data.suggestions.length} potential vulnerabilities`);
            refetch();
        },
        onError: (err) => toast.error(`Scan failed: ${err.message}`),
    });

    // Update status mutation
    const updateStatusMutation = trpc.threatIntel.updateMatchStatus.useMutation({
        onSuccess: () => {
            refetch();
        },
    });

    // Import as vulnerability mutation
    const importMutation = trpc.threatIntel.importCveAsVulnerability.useMutation({
        onSuccess: (data) => {
            toast.success(`Imported ${data.vulnerability.vulnId} as vulnerability`);
            refetch();
            onVulnerabilityImported?.();
        },
        onError: (err) => toast.error(`Import failed: ${err.message}`),
    });

    const handleScan = async () => {
        setIsScanning(true);
        try {
            await scanMutation.mutateAsync({ clientId, assetId });
        } finally {
            setIsScanning(false);
        }
    };

    const getSeverityInfo = (score: string | null) => {
        const numScore = parseFloat(score || '0');
        if (numScore >= 9) return { color: 'bg-red-600 text-white', label: 'Critical', textColor: 'text-red-600' };
        if (numScore >= 7) return { color: 'bg-orange-500 text-white', label: 'High', textColor: 'text-orange-600' };
        if (numScore >= 4) return { color: 'bg-yellow-500 text-black', label: 'Medium', textColor: 'text-yellow-600' };
        return { color: 'bg-green-500 text-white', label: 'Low', textColor: 'text-green-600' };
    };

    const hasVendorProduct = !!(assetVendor && assetProduct);

    const activeSuggestions = suggestions?.filter(s => s.status === 'suggested') || [];
    const kevCount = activeSuggestions.filter(s => s.isKev).length;

    return (
        <Card className="border-orange-200 dark:border-orange-900/30">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-orange-600" />
                        <CardTitle className="text-lg">Threat Intelligence</CardTitle>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleScan}
                        disabled={isScanning || scanMutation.isPending}
                    >
                        {isScanning || scanMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Scan NVD
                    </Button>
                </div>
                <CardDescription>
                    AI-powered vulnerability discovery for "{assetName}"
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Stats Bar */}
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{activeSuggestions.length}</span>
                        <span className="text-muted-foreground">Suggestions</span>
                    </div>
                    {kevCount > 0 && (
                        <div className="flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-red-500" />
                            <span className="font-medium text-red-600">{kevCount}</span>
                            <span className="text-muted-foreground">KEV (Critical)</span>
                        </div>
                    )}
                </div>

                {/* Suggestions List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Loading suggestions...
                    </div>
                ) : activeSuggestions.length === 0 ? (
                    <div className="text-center py-8">
                        <Shield className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                        {!hasVendorProduct ? (
                            <>
                                <p className="font-medium text-foreground">Configure Technical Identifiers</p>
                                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                                    Add <span className="font-medium">Vendor</span> and <span className="font-medium">Product Name</span> in the Basic Info tab for accurate CVE matching.
                                </p>
                                <div className="mt-3 p-2 bg-muted/50 rounded-md inline-block">
                                    <p className="text-xs text-muted-foreground">Example: <span className="font-mono">Apache → Tomcat</span></p>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="font-medium text-foreground">No vulnerabilities found</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    No CVEs match "{assetVendor} {assetProduct}" in the NVD database.
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Click "Scan NVD" to check for new vulnerabilities.
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {activeSuggestions.map((suggestion, index) => (
                            <div
                                key={`${suggestion.cveId}-${index}`}
                                className={`p-3 rounded-lg border ${suggestion.isKev
                                    ? 'border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20'
                                    : 'border-border bg-card'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <a
                                                href={`https://nvd.nist.gov/vuln/detail/${suggestion.cveId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-mono text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                {suggestion.cveId}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>

                                            {suggestion.cvssScore && (() => {
                                                const severity = getSeverityInfo(suggestion.cvssScore);
                                                return (
                                                    <Badge className={`text-xs ${severity.color}`}>
                                                        {severity.label} ({suggestion.cvssScore})
                                                    </Badge>
                                                );
                                            })()}

                                            {suggestion.isKev && (
                                                <Badge variant="destructive" className="text-xs flex items-center gap-1">
                                                    <Zap className="w-3 h-3" />
                                                    KEV
                                                </Badge>
                                            )}
                                        </div>

                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {suggestion.description}
                                        </p>

                                        <p className="text-xs text-muted-foreground mt-1 italic">
                                            {suggestion.matchReason}
                                        </p>
                                    </div>

                                    <div className="flex gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                                            onClick={() => importMutation.mutate({
                                                clientId,
                                                assetId,
                                                cveId: suggestion.cveId,
                                                matchId: (suggestion as any).matchId,
                                            })}
                                            disabled={importMutation.isPending}
                                            title="Import as Vulnerability"
                                        >
                                            <Import className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                                            onClick={() => {
                                                const mid = (suggestion as any).matchId;
                                                if (mid) {
                                                    updateStatusMutation.mutate({
                                                        matchId: mid,
                                                        status: 'dismissed',
                                                    });
                                                }
                                            }}
                                            disabled={updateStatusMutation.isPending}
                                            title="Dismiss"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs flex flex-wrap gap-2">
                                    {(suggestion as any).cweIds?.map((cwe: string) => (
                                        <Badge key={cwe} variant="secondary" className="text-[10px] px-1 h-5 text-muted-foreground">
                                            {cwe}
                                        </Badge>
                                    ))}
                                </div>
                                <details className="group mt-2">
                                    <summary className="cursor-pointer flex items-center gap-1 hover:text-foreground list-none font-medium text-xs">
                                        <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                                        Details & References
                                    </summary>
                                    <div className="mt-2 pl-4 space-y-2 border-l-2 border-muted/50 ml-1.5">
                                        {/* Affected Versions */}
                                        {(suggestion as any).affectedProducts?.length > 0 && (
                                            <div>
                                                <p className="font-medium text-[10px] uppercase text-muted-foreground mb-1">Affected Versions</p>
                                                <ul className="list-disc pl-3">
                                                    {[...new Set((suggestion as any).affectedProducts)].slice(0, 3).map((prod: any, i: number) => (
                                                        <li key={i}>{prod}</li>
                                                    ))}
                                                    {(suggestion as any).affectedProducts.length > 3 && (
                                                        <li>+ {(suggestion as any).affectedProducts.length - 3} more</li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}

                                        {/* References */}
                                        {(suggestion as any).references?.length > 0 && (
                                            <div>
                                                <p className="font-medium text-[10px] uppercase text-muted-foreground mb-1">References</p>
                                                <ul className="space-y-1">
                                                    {(suggestion as any).references?.slice(0, 3).map((ref: any, i: number) => (
                                                        <li key={i}>
                                                            <a href={ref.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1 text-blue-600 break-all">
                                                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                                                {new URL(ref.url).hostname}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </details>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer info */}
                <div className="pt-3 border-t text-xs text-muted-foreground flex items-center justify-between">
                    <span>Data from NVD & CISA KEV</span>
                    <a
                        href="https://nvd.nist.gov/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                        NVD Database <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </CardContent>
        </Card >
    );
}

export default ThreatIntelPanel;
