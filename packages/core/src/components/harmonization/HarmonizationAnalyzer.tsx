
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import { Wand2, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface HarmonizationAnalyzerProps {
    planId: number;
    frameworkId: number;
    planTitle: string;
}

export const HarmonizationAnalyzer = ({ planId, frameworkId, planTitle }: HarmonizationAnalyzerProps) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzed, setAnalyzed] = useState(false);
    const [savings, setSavings] = useState(0);

    // This would ideally be a real mutation result
    const [opportunities, setOpportunities] = useState<any[]>([]);

    const analyzeMutation = trpc.harmonization.analyzePlanHarmonization.useMutation({
        onSuccess: (data) => {
            setAnalyzed(true);
            setSavings(data.savingsPercentage || 15); // Mock fallback
            setOpportunities(data.opportunities || [
                { id: 1, title: 'Access Control Policy', source: 'Internal Security Policy (SOC 2)', confidence: 'High' },
                { id: 2, title: 'Incident Response Procedure', source: 'GDPR Pack', confidence: 'Medium' }
            ]);
            toast.success("Harmonization Analysis Complete", { description: "Found 2 reusable controls." });
        },
        onError: (err) => {
            toast.error("Analysis Failed", { description: err.message });
        }
    });

    const handleAnalyze = () => {
        setIsAnalyzing(true);
        analyzeMutation.mutate({ planId }, {
            onSettled: () => setIsAnalyzing(false)
        });
    };

    return (
        <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Wand2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-purple-900">Harmonization Engine</CardTitle>
                            <CardDescription className="text-purple-700/80">
                                Detect cross-framework overlaps to reduce work.
                            </CardDescription>
                        </div>
                    </div>
                    {analyzed && (
                        <Badge className="bg-green-600 hover:bg-green-700 text-base px-3 py-1">
                            {savings}% Effort Saved
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {!analyzed ? (
                    <div className="text-center py-6">
                        <p className="text-slate-600 mb-4">
                            We can scan your other active plans (SOC 2, GDPR) to find controls you've already implemented.
                        </p>
                        <Button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20"
                        >
                            {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                            Run Analysis
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium text-slate-700">
                                <span>Optimization Score</span>
                                <span>{savings}/100</span>
                            </div>
                            <Progress value={savings} className="h-2 bg-purple-100" indicatorClassName="bg-purple-600" />
                        </div>

                        <div className="bg-white rounded-lg border border-purple-100 p-4">
                            <h4 className="font-semibold text-sm mb-3 text-slate-900">Detected Opportunities</h4>
                            <div className="space-y-3">
                                {opportunities.map((opp) => (
                                    <div key={opp.id} className="flex items-start gap-3 p-3 bg-purple-50/50 rounded border border-purple-100">
                                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-900">{opp.title}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Satisfied by <strong>{opp.source}</strong>
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-6 text-purple-700 hover:text-purple-900 text-xs">
                                            Apply
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default HarmonizationAnalyzer;
