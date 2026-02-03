
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import { cn } from "@/lib/utils";
import {
  Shield,
  Search,
  ExternalLink,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Globe,
  Lock
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface VendorTrustCenterProps {
  vendor: any;
  onRefresh?: () => void;
}

export const VendorTrustCenter: React.FC<VendorTrustCenterProps> = ({ vendor, onRefresh }) => {
  // State to manage automatic polling after discovery
  const [isPolling, setIsPolling] = React.useState(false);

  // Polling effect: Refresh data every 3s when polling is active (max 45s)
  React.useEffect(() => {
    if (!isPolling) return;

    // Refresh immediately
    if (onRefresh) onRefresh();

    const intervalId = setInterval(() => {
      if (onRefresh) onRefresh();
    }, 3000);

    // Stop polling after 45 seconds to prevent infinite loops
    const timeoutId = setTimeout(() => {
      setIsPolling(false);
      toast.info("Background analysis monitoring period ended. Please refresh manually if data is still not visible.");
    }, 45000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [isPolling, onRefresh]);

  // Stop polling if we see new trust center data (heuristic)
  React.useEffect(() => {
    if (isPolling && vendor.trustCenterData?.riskSummary) {
      // If we were polling and now we have a summary, we can likely stop
    }
  }, [vendor.trustCenterData, isPolling]);

  const discoverMutation = trpc.vendors.discoverTrustCenter.useMutation({
    onSuccess: (data) => {
      toast.success("Trust Center URL discovered! AI Analysis is now running in the background.");
      // Start polling for updates
      setIsPolling(true);
    },
    onError: (error) => {
      toast.error(`Discovery failed: ${error.message}`);
    }
  });

  const analyzeMutation = trpc.vendors.analyzeTrustCenter.useMutation({
    onSuccess: () => {
      toast.success("AI VRM Analysis complete!");
      if (onRefresh) onRefresh();
      // Also poll briefly just in case changes are propagating
      setIsPolling(true);
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    }
  });

  const utils = trpc.useContext();

  const trustData = vendor.trustCenterData as any;

  const handleDiscover = () => {
    if (!vendor?.id) return toast.error("Vendor ID is missing. Wait for page to load.");
    discoverMutation.mutate({ vendorId: Number(vendor.id) });
  };

  const handleAnalyze = () => {
    if (!vendor?.id) return toast.error("Vendor ID is missing.");
    if (!vendor.trustCenterUrl) return toast.error("No Trust Center URL found. Run discovery first.");
    analyzeMutation.mutate({ vendorId: Number(vendor.id), url: vendor.trustCenterUrl });
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">AI Virtual Trust Center</h2>
            <p className="text-muted-foreground">Automated Vendor Risk & Compliance Discovery</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!vendor.trustCenterUrl ? "default" : "outline"}
            onClick={handleDiscover}
            disabled={discoverMutation.isPending}
            className={cn(
              "flex-1 md:flex-none font-bold transition-all transform hover:scale-105 active:scale-95",
              !vendor.trustCenterUrl
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/50 animate-pulse-blue border-none"
                : "border-blue-200 text-blue-700 hover:bg-blue-50"
            )}
          >
            {discoverMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Refresh Discovery
          </Button>
          <Button
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending || !vendor.trustCenterUrl}
            className={cn(
              "flex-1 md:flex-none font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/50 transition-all transform hover:scale-105 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none",
              analyzeMutation.isPending && "animate-pulse"
            )}
          >
            {analyzeMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck className="w-4 h-4 mr-2" />}
            Re-run AI Analysis
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Trust Score Card */}
        <Card className="md:col-span-1 overflow-hidden relative border-none bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">Overall Trust Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6">
              <div className="text-6xl font-black mb-2 flex items-baseline">
                <span className={scoreColor(vendor.trustScore || 0)}>{vendor.trustScore || "—"}</span>
                <span className="text-2xl text-slate-500 ml-1">/100</span>
              </div>
              <p className="text-slate-400 text-sm text-center">
                Based on public certifications, security documentation, and disclosure transparency.
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Trust Level</span>
                <span className="font-semibold text-white">
                  {vendor.trustScore >= 80 ? "Premium" : vendor.trustScore >= 50 ? "Standard" : "Needs Review"}
                </span>
              </div>
              <Progress value={vendor.trustScore || 0} className="h-2 bg-slate-700" />
            </div>
          </CardContent>
        </Card>

        {/* Risk Analysis Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              AI Security Posture Analysis
            </CardTitle>
            <CardDescription>Generated assessment of public-facing security controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {trustData?.riskSummary ? (
              <div className="p-4 bg-muted/50 rounded-lg border border-border italic text-sm text-muted-foreground leading-relaxed">
                {isPolling && <div className="flex items-center gap-2 mb-2 text-blue-600 text-xs font-semibold animate-pulse"><RefreshCw className="h-3 w-3 animate-spin" /> Updating Analysis...</div>}
                "{trustData.riskSummary}"
              </div>
            ) : isPolling ? (
              <div className="flex flex-col items-center justify-center py-8 text-blue-600 animate-pulse bg-blue-50/50 rounded-lg border border-blue-100">
                <RefreshCw className="h-8 w-8 animate-spin mb-4" />
                <p className="text-sm font-semibold">AI Agent is analyzing vendor documentation...</p>
                <p className="text-xs text-blue-400 mt-1">This usually takes 15-30 seconds</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No analysis performed yet. Click re-run to start AI discovery.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">Detected Artifacts</h4>
                <div className="space-y-1.5">
                  {trustData?.docs?.map((doc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-background border border-border text-xs">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        {doc.name}
                      </span>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )) || <p className="text-xs text-muted-foreground italic">None detected</p>}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">Likely Gaps</h4>
                <div className="space-y-1.5">
                  {trustData?.gaps?.map((gap: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-red-500/5 border border-red-500/10 text-xs text-red-700 dark:text-red-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span>{gap}</span>
                    </div>
                  )) || <p className="text-xs text-muted-foreground italic">No obvious gaps detected</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Public Discovery Details</CardTitle>
          <CardDescription>How our AI VRM Agent found this information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-muted border border-border">
              <span className="text-xs font-medium text-muted-foreground block mb-1 uppercase">Source URL</span>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                {vendor.trustCenterUrl ? (
                  <a
                    href={vendor.trustCenterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs break-all text-primary hover:underline flex items-center gap-1"
                  >
                    {vendor.trustCenterUrl}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="font-mono text-xs text-muted-foreground italic">No URL discovered</span>
                )}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted border border-border">
              <span className="text-xs font-medium text-muted-foreground block mb-1 uppercase">Scan Status</span>
              <div className="flex items-center gap-2">
                {trustData ? (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">Verified</Badge>
                ) : (
                  <Badge variant="outline">Pending Scan</Badge>
                )}
                <span className="text-xs text-muted-foreground">Checked by ComplianceOS AI Agent</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Verification Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <CardTitle>Manual Compliance Verification</CardTitle>
              <CardDescription>Manually verify compliance artifacts and status.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: 'soc2', label: 'SOC 2 Type II', desc: 'AICPA Service Organization Control' },
              { id: 'iso27001', label: 'ISO 27001', desc: 'Information Security Management' },
              { id: 'gdpr', label: 'GDPR Compliant', desc: 'General Data Protection Regulation' },
              { id: 'ccpa', label: 'CCPA/CPRA', desc: 'California Consumer Privacy Act' },
              { id: 'dpa', label: 'DPA Signed', desc: 'Data Processing Agreement executed' },
              { id: 'fedramp', label: 'FedRAMP', desc: 'Federal Risk and Authorization Management' },
              { id: 'hipaa', label: 'HIPAA', desc: 'Health Insurance Portability and Accountability' },
              { id: 'pci', label: 'PCI DSS', desc: 'Payment Card Industry Data Security' },
              { id: 'privacyshield', label: 'Privacy Shield', desc: 'Data Privacy Framework' },
            ].map(check => {
              const checked = !!trustData?.manual?.[check.id];

              const updateStatus = (isChecked: boolean) => {
                if (!vendor?.id) return;
                const currentData = vendor.trustCenterData || {};
                const newManual = { ...currentData.manual, [check.id]: isChecked };

                // Optimistic update
                utils.vendors.get.setData({ id: vendor.id }, (old) => old ? { ...old, trustCenterData: { ...currentData, manual: newManual } } : old);

                trpc.vendors.update.mutate({
                  id: vendor.id,
                  trustCenterData: { ...currentData, manual: newManual }
                }).then(() => {
                  toast.success(`Updated ${check.label}`, { duration: 1500 });
                  if (onRefresh) onRefresh();
                }).catch(err => {
                  console.error("Failed to update vendor trust center:", err);
                  toast.error("Failed to save: " + (err.message || "Unknown error"));
                  // Revert optimistic update
                  utils.vendors.get.invalidate({ id: vendor.id });
                });
              };

              return (
                <div
                  key={check.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={(e) => {
                    // Start toggle if clicking row but NOT input (input handles itself)
                    if ((e.target as HTMLElement).tagName !== 'INPUT') {
                      updateStatus(!checked);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    id={check.id}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                    checked={checked}
                    onChange={(e) => updateStatus(e.target.checked)}
                  />
                  <div className="space-y-1">
                    <label htmlFor={check.id} className="font-medium text-sm cursor-pointer select-none pointer-events-none">{check.label}</label>
                    <p className="text-xs text-muted-foreground select-none pointer-events-none">{check.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
