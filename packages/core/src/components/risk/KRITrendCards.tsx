import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, Activity, Target } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface KRICardProps {
    title: string;
    value: number | string;
    previousValue?: number;
    icon: React.ComponentType<{ className?: string }>;
    colorScheme: 'red' | 'yellow' | 'green' | 'blue';
    suffix?: string;
    isLoading?: boolean;
}

function KRICard({ title, value, previousValue, icon: Icon, colorScheme, suffix = '', isLoading }: KRICardProps) {
    const colors = {
        red: { bg: 'bg-red-500', text: 'text-white', icon: 'bg-white/20 text-white' },
        yellow: { bg: 'bg-amber-500', text: 'text-white', icon: 'bg-white/20 text-white' },
        green: { bg: 'bg-emerald-500', text: 'text-white', icon: 'bg-white/20 text-white' },
        blue: { bg: 'bg-blue-500', text: 'text-white', icon: 'bg-white/20 text-white' }
    };

    const scheme = colors[colorScheme];

    // Calculate trend
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    let trendPercent = 0;
    if (previousValue !== undefined && typeof value === 'number') {
        if (value > previousValue) {
            trend = 'up';
            trendPercent = previousValue > 0 ? Math.round(((value - previousValue) / previousValue) * 100) : 100;
        } else if (value < previousValue) {
            trend = 'down';
            trendPercent = previousValue > 0 ? Math.round(((previousValue - value) / previousValue) * 100) : 0;
        }
    }

    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

    return (
        <Card className={`${scheme.bg} border-none shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl duration-300`}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-xs font-bold text-white/70 uppercase tracking-widest">{title}</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            {isLoading ? (
                                <div className="h-8 w-16 bg-white/20 animate-pulse rounded" />
                            ) : (
                                <>
                                    <span className={`text-2xl font-black ${scheme.text}`}>{value}{suffix}</span>
                                    {previousValue !== undefined && (
                                        <span className={`text-xs font-bold flex items-center gap-0.5 ${trend === 'up' ? 'text-white' : trend === 'down' ? 'text-white' : 'text-white/60'}`}>
                                            <TrendIcon className="w-3 h-3" />
                                            {trendPercent}%
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    <div className={`p-3 rounded-xl ${scheme.icon} backdrop-blur-md border border-white/10 shadow-inner`}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface KRITrendCardsProps {
    clientId: number;
}

export function KRITrendCards({ clientId }: KRITrendCardsProps) {
    // Fetch KRI data
    const { data: stats, isLoading } = trpc.risks.getKRIStats.useQuery(
        { clientId },
        { enabled: !!clientId, staleTime: 60000 }
    );

    const kris = [
        {
            title: 'High/Critical Risks',
            value: stats?.highRiskCount ?? 0,
            previousValue: stats?.previousHighRiskCount,
            icon: AlertTriangle,
            colorScheme: 'red' as const
        },
        {
            title: 'Avg Residual Score',
            value: stats?.avgResidualScore ?? 0,
            previousValue: stats?.previousAvgResidual,
            icon: Target,
            colorScheme: 'yellow' as const
        },
        {
            title: 'Controls Linked',
            value: stats?.linkedControlsCount ?? 0,
            previousValue: stats?.previousLinkedControls,
            icon: Shield,
            colorScheme: 'green' as const
        },
        {
            title: 'Treatment Progress',
            value: stats?.treatmentProgress ?? 0,
            previousValue: stats?.previousTreatmentProgress,
            icon: Activity,
            colorScheme: 'blue' as const,
            suffix: '%'
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kris.map((kri, i) => (
                <KRICard key={i} {...kri} isLoading={isLoading} />
            ))}
        </div>
    );
}

export default KRITrendCards;
