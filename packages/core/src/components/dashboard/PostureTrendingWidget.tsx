import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, Calendar, Target, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PostureTrendingWidgetProps {
    clientId: number;
}

export function PostureTrendingWidget({ clientId }: PostureTrendingWidgetProps) {
    const { data: history = [], isLoading: historyLoading, refetch } = trpc.postureTrending.getHistory.useQuery(
        { clientId, limit: 8 },
        { staleTime: 60000 }
    );

    const { data: forecast, isLoading: forecastLoading } = trpc.postureTrending.getForecast.useQuery(
        { clientId },
        { staleTime: 60000 }
    );

    const createSnapshot = trpc.postureTrending.createSnapshot.useMutation({
        onSuccess: () => {
            toast.success("Snapshot created successfully");
            refetch();
        },
        onError: (error) => toast.error(error.message),
    });

    const isLoading = historyLoading || forecastLoading;
    const sortedHistory = [...history].reverse(); // Oldest first for chart

    // Calculate trend from last 2 snapshots
    const trend = history.length >= 2
        ? (history[0].complianceScore || 0) - (history[1].complianceScore || 0)
        : 0;

    if (isLoading) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Compliance Trend
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-48 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Compliance Trend
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {history.length > 0 ? `${history.length} snapshots` : 'No data yet'}
                        </CardDescription>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => createSnapshot.mutate({ clientId })}
                        disabled={createSnapshot.isPending}
                    >
                        {createSnapshot.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <RefreshCw className="h-3 w-3" />
                        )}
                        Snapshot
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {history.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-muted-foreground text-sm">
                        <Target className="h-8 w-8 mb-2 opacity-50" />
                        <p>No snapshots yet</p>
                        <p className="text-xs">Click "Snapshot" to start tracking</p>
                    </div>
                ) : (
                    <>
                        {/* Current Score */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-3xl font-bold">{history[0]?.complianceScore || 0}%</div>
                                <div className="text-xs text-muted-foreground">Current Score</div>
                            </div>
                            <div className="flex items-center gap-1">
                                {trend > 0 ? (
                                    <Badge className="bg-green-100 text-green-700 gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        +{trend}%
                                    </Badge>
                                ) : trend < 0 ? (
                                    <Badge className="bg-red-100 text-red-700 gap-1">
                                        <TrendingDown className="h-3 w-3" />
                                        {trend}%
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="gap-1">
                                        No change
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Mini Chart */}
                        <div className="h-16 flex items-end gap-1">
                            {sortedHistory.map((s, i) => (
                                <div
                                    key={s.id}
                                    className="flex-1 bg-primary/20 rounded-t relative group cursor-pointer"
                                    style={{ height: `${s.complianceScore || 0}%` }}
                                    title={`${new Date(s.snapshotDate).toLocaleDateString()}: ${s.complianceScore}%`}
                                >
                                    <div
                                        className="absolute inset-0 bg-primary rounded-t opacity-0 group-hover:opacity-100 transition-opacity"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>{sortedHistory[0] && new Date(sortedHistory[0].snapshotDate).toLocaleDateString()}</span>
                            <span>{sortedHistory[sortedHistory.length - 1] && new Date(sortedHistory[sortedHistory.length - 1].snapshotDate).toLocaleDateString()}</span>
                        </div>

                        {/* Forecast */}
                        {forecast?.hasEnoughData && (
                            <div className="border-t pt-3 space-y-2">
                                <div className="text-xs font-medium text-muted-foreground">Forecast</div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <span>
                                        {forecast.weeksTo100 !== null ? (
                                            <>100% in <strong>{forecast.weeksTo100} weeks</strong></>
                                        ) : (
                                            <span className="text-muted-foreground">Velocity too low to forecast</span>
                                        )}
                                    </span>
                                </div>
                                {forecast.avgVelocity > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                        Average: {forecast.avgVelocity} controls/week
                                    </div>
                                )}
                                {forecast.milestones && forecast.milestones.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {forecast.milestones.slice(0, 3).map((m: any) => (
                                            <Badge key={m.score} variant="outline" className="text-[10px]">
                                                {m.score}% in {m.weeksEstimate}w
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {forecast && !forecast.hasEnoughData && (
                            <div className="border-t pt-3 text-xs text-muted-foreground text-center">
                                {forecast.message}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
