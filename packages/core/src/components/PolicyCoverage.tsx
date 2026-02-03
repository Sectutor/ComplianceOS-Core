import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Progress } from "@complianceos/ui/ui/progress";
import { Badge } from "@complianceos/ui/ui/badge";
import { Skeleton } from "@complianceos/ui/ui/skeleton";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, FileText, Link2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PolicyCoverageProps {
  clientId: number;
  onMappingCreated?: () => void;
}

export default function PolicyCoverage({ clientId, onMappingCreated }: PolicyCoverageProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMappings, setSelectedMappings] = useState<{ clientControlId: number; clientPolicyId: number }[]>([]);
  const [expandedPolicies, setExpandedPolicies] = useState<Set<number>>(new Set());

  const { data: coverage, isLoading, refetch } = trpc.mappings.policyCoverage.useQuery(
    { clientId },
    { enabled: clientId > 0 }
  );

  const { data: suggestions, isLoading: suggestionsLoading } = trpc.mappings.suggestedMappings.useQuery(
    { clientId },
    { enabled: clientId > 0 && showSuggestions }
  );

  const bulkCreateMutation = trpc.mappings.bulkCreate.useMutation({
    onSuccess: (result) => {
      toast.success(`Created ${result.created} mappings${result.skipped > 0 ? `, ${result.skipped} already existed` : ''}`);
      setSelectedMappings([]);
      setShowSuggestions(false);
      refetch();
      onMappingCreated?.();
    },
    onError: (error) => toast.error(error.message),
  });

  const togglePolicyExpand = (policyId: number) => {
    const newExpanded = new Set(expandedPolicies);
    if (newExpanded.has(policyId)) {
      newExpanded.delete(policyId);
    } else {
      newExpanded.add(policyId);
    }
    setExpandedPolicies(newExpanded);
  };

  const toggleMapping = (clientControlId: number, clientPolicyId: number) => {
    const exists = selectedMappings.some(
      m => m.clientControlId === clientControlId && m.clientPolicyId === clientPolicyId
    );

    if (exists) {
      setSelectedMappings(selectedMappings.filter(
        m => !(m.clientControlId === clientControlId && m.clientPolicyId === clientPolicyId)
      ));
    } else {
      setSelectedMappings([...selectedMappings, { clientControlId, clientPolicyId }]);
    }
  };

  const selectAllSuggestions = () => {
    if (!suggestions) return;

    const allMappings: { clientControlId: number; clientPolicyId: number }[] = [];
    for (const suggestion of suggestions) {
      for (const policy of suggestion.suggestedPolicies) {
        allMappings.push({
          clientControlId: suggestion.controlId,
          clientPolicyId: policy.policyId,
        });
      }
    }
    setSelectedMappings(allMappings);
  };

  const handleApplyMappings = () => {
    if (selectedMappings.length === 0) {
      toast.error("No mappings selected");
      return;
    }
    bulkCreateMutation.mutate({ clientId, mappings: selectedMappings });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!coverage) return null;

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Control-Policy Coverage
              </CardTitle>
              <CardDescription>
                How well your controls are mapped to policies
              </CardDescription>
            </div>
            {coverage.unmappedControls > 0 && (
              <Button variant="outline" onClick={() => setShowSuggestions(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Auto-Suggest Mappings
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Coverage Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className={`text-3xl font-bold ${getCoverageColor(coverage.coveragePercentage)}`}>
                {coverage.coveragePercentage}%
              </div>
              <div className="text-sm text-muted-foreground">Coverage</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold">{coverage.totalControls}</div>
              <div className="text-sm text-muted-foreground">Total Controls</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{coverage.mappedControls}</div>
              <div className="text-sm text-muted-foreground">Mapped</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{coverage.unmappedControls}</div>
              <div className="text-sm text-muted-foreground">Unmapped</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Mapping Progress</span>
              <span>{coverage.mappedControls} / {coverage.totalControls} controls</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${getProgressColor(coverage.coveragePercentage)}`}
                style={{ width: `${coverage.coveragePercentage}%` }}
              />
            </div>
          </div>

          {/* Policy Coverage Details */}
          {coverage.policyCoverage.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Policy Coverage Details
              </h4>
              <div className="space-y-2">
                {coverage.policyCoverage.map((policy) => (
                  <div key={policy.policyId} className="border rounded-lg">
                    <button
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                      onClick={() => togglePolicyExpand(policy.policyId)}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{policy.policyName}</span>
                        <Badge variant="secondary">{policy.controlCount} controls</Badge>
                      </div>
                      {expandedPolicies.has(policy.policyId) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {expandedPolicies.has(policy.policyId) && policy.controls.length > 0 && (
                      <div className="px-3 pb-3 border-t">
                        <div className="pt-3 space-y-1">
                          {policy.controls.map((control) => (
                            <div key={control.id} className="flex items-center gap-2 text-sm text-muted-foreground pl-7">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              <span className="font-mono">{control.controlId}</span>
                              <span>-</span>
                              <span>{control.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unmapped Controls Warning */}
          {coverage.unmappedControls > 0 && (
            <div className="border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                    {coverage.unmappedControls} Controls Without Policy Mappings
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    These controls are not linked to any policies. Click "Auto-Suggest Mappings" to get recommendations based on control categories.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {coverage.unmappedControlsList.slice(0, 5).map((control) => (
                      <Badge key={control.id} variant="outline" className="text-yellow-700 border-yellow-300">
                        {control.controlId}
                      </Badge>
                    ))}
                    {coverage.unmappedControlsList.length > 5 && (
                      <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                        +{coverage.unmappedControlsList.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Mapped Success */}
          {coverage.unmappedControls === 0 && coverage.totalControls > 0 && (
            <div className="border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200">
                    All Controls Mapped
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Every control has at least one policy mapping. Great job!
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggestions Dialog */}
      <EnhancedDialog
        open={showSuggestions}
        onOpenChange={setShowSuggestions}
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Suggested Control-Policy Mappings
          </div>
        }
        description="Based on control categories and policy types, here are recommended mappings for your unmapped controls."
        size="lg"
        footer={
          <div className="flex justify-between items-center w-full">
            <Button variant="outline" onClick={() => setShowSuggestions(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApplyMappings}
              disabled={selectedMappings.length === 0 || bulkCreateMutation.isPending}
            >
              {bulkCreateMutation.isPending ? "Creating..." : `Apply ${selectedMappings.length} Mappings`}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {suggestionsLoading ? (
            <div className="py-8">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : suggestions && suggestions.length > 0 ? (
            <>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">
                  {selectedMappings.length} mappings selected
                </span>
                <Button variant="outline" size="sm" onClick={selectAllSuggestions}>
                  Select All
                </Button>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {suggestions.map((suggestion) => (
                    <div key={suggestion.controlId} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">{suggestion.clientControlId}</span>
                            <Badge variant="secondary">{suggestion.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{suggestion.controlName}</p>

                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Suggested Policies:</p>
                            {suggestion.suggestedPolicies.map((policy) => {
                              const isSelected = selectedMappings.some(
                                m => m.clientControlId === suggestion.controlId && m.clientPolicyId === policy.policyId
                              );
                              return (
                                <label
                                  key={policy.policyId}
                                  className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleMapping(suggestion.controlId, policy.policyId)}
                                  />
                                  <div className="flex-1">
                                    <span className="font-medium">{policy.policyName}</span>
                                    <p className="text-xs text-muted-foreground">{policy.matchReason}</p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>No suggestions available. Make sure you have policies created from templates.</p>
            </div>
          )}
        </div>
      </EnhancedDialog>
    </>
  );
}
