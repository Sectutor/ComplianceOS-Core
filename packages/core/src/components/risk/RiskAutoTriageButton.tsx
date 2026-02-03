import React from 'react';
import { Button } from '@complianceos/ui/ui/button';
import { Loader2, Wand2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface RiskAutoTriageButtonProps {
    clientId: number;
    threatDescription: string;
    vulnerabilityDescription: string;
    affectedAssets: string[];
    onAnalysisComplete: (data: { likelihood: string; impact: string; inherentRisk: any; reasoning: string }) => void;
}

export function RiskAutoTriageButton({
    clientId,
    threatDescription,
    vulnerabilityDescription,
    affectedAssets,
    onAnalysisComplete
}: RiskAutoTriageButtonProps) {
    const analyzeMutation = trpc.advisor.analyzeRisk.useMutation({
        onSuccess: (data) => {
            onAnalysisComplete({
                likelihood: data.likelihood,
                impact: data.impact,
                inherentRisk: data.inherentRisk,
                reasoning: data.reasoning
            });
            toast.success('Risk scored by AI', {
                description: data.reasoning,
                duration: 5000
            });
        },
        onError: (err) => {
            toast.error(`Auto-triage failed: ${err.message}`);
        }
    });

    const handleAutoTriage = async () => {
        if (!threatDescription || !vulnerabilityDescription) {
            toast.error('Please enter threat and vulnerability descriptions first');
            return;
        }

        toast.info('Analyzing risk scenario...');
        await analyzeMutation.mutateAsync({
            clientId,
            threat: threatDescription,
            vulnerability: vulnerabilityDescription,
            assets: affectedAssets
        });
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoTriage}
            disabled={analyzeMutation.isLoading}
            className="gap-2 text-violet-600 border-violet-200 hover:bg-violet-50"
        >
            {analyzeMutation.isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            Auto-Triage with AI
        </Button>
    );
}
