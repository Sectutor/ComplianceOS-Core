import React, { useState } from 'react';
import { trpc } from '../../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Search, Loader2, PlusCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Badge } from "@complianceos/ui/ui/badge";
import { toast } from 'sonner';

interface GapAnalysisProps {
    clientId: number;
    threat: string;
    vulnerability: string;
    onControlAdopted?: () => void;
}

export function GapAnalysis({ clientId, threat, vulnerability, onControlAdopted }: GapAnalysisProps) {
    const [gaps, setGaps] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdopting, setIsAdopting] = useState<number | null>(null);

    const analyzeMutation = trpc.risks.analyzeGaps.useMutation();
    const createControlMutation = trpc.clientControls.create.useMutation();

    const handleAnalyze = async () => {
        if (!threat || !vulnerability) {
            toast.error("Please enter Threat and Vulnerability first.");
            return;
        }

        setIsLoading(true);
        try {
            const result = await analyzeMutation.mutateAsync({
                clientId,
                threat,
                vulnerability
            });
            setGaps(result.gaps);
        } catch (error) {
            console.error("Analysis failed", error);
            toast.error("Failed to perform gap analysis.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdopt = async (gap: any) => {
        setIsAdopting(gap.controlId);
        try {
            await createControlMutation.mutateAsync({
                clientId,
                controlId: gap.controlId,
                status: 'not_implemented', // Default state for adopted controls
                customDescription: gap.details.name
            });
            toast.success(`Adopted control: ${gap.details.code}`);

            // Remove from list
            setGaps(prev => prev ? prev.filter(g => g.controlId !== gap.controlId) : null);

            if (onControlAdopted) onControlAdopted();
        } catch (error) {
            console.error("Adoption failed", error);
            toast.error("Failed to adopt control.");
        } finally {
            setIsAdopting(null);
        }
    };

    return (
        <Card className="border-orange-200 bg-orange-50/30">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center text-orange-800">
                    <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                    Gap Analysis: Missing Controls
                </CardTitle>
                <CardDescription>
                    Identify critical controls you are missing that would mitigate this risk.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!gaps && !isLoading && (
                    <Button
                        variant="outline"
                        onClick={handleAnalyze}
                        className="w-full border-orange-300 text-orange-700 hover:bg-orange-100 hover:border-orange-400"
                        disabled={!threat || !vulnerability}
                    >
                        <Search className="w-4 h-4 mr-2" />
                        Run Gap Analysis
                    </Button>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center p-6 space-y-2">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                        <span className="text-sm text-orange-700 font-medium">Scanning Master Control Library...</span>
                    </div>
                )}

                {gaps && (
                    <div className="space-y-3">
                        {gaps.length === 0 ? (
                            <div className="text-center p-4 text-green-700 bg-green-50 rounded-md border border-green-200 text-sm">
                                No critical gaps found! You likely have good coverage options.
                            </div>
                        ) : (
                            gaps.map((gap: any) => (
                                <div key={gap.controlId} className="bg-white border border-orange-200 rounded-md p-3 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={gap.priority === 'HIGH' ? 'destructive' : 'default'} className={gap.priority === 'HIGH' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}>
                                                {gap.priority} PRIORITY
                                            </Badge>
                                            <span className="font-bold text-slate-800">{gap.details.code}</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleAdopt(gap)}
                                            disabled={isAdopting === gap.controlId}
                                            className="bg-orange-600 hover:bg-orange-700 text-white h-7 text-xs"
                                        >
                                            {isAdopting === gap.controlId ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <>
                                                    Adopt <ArrowRight className="w-3 h-3 ml-1" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <h4 className="text-sm font-semibold text-slate-900 mb-1">{gap.details.name}</h4>
                                    <p className="text-xs text-slate-600 mb-2">{gap.details.description}</p>
                                    <div className="bg-orange-50 p-2 rounded text-xs text-orange-800 italic">
                                        " {gap.reasoning} "
                                    </div>
                                </div>
                            ))
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setGaps(null)} className="w-full text-xs text-slate-500">
                            Clear Results
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
