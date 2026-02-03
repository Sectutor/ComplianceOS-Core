import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Separator } from "@complianceos/ui/ui/separator";
import { trpc } from "@/lib/trpc";
import { Target, Flag, TrendingUp, Scale, Building2, AlertTriangle, Shield, Clock, DollarSign, Calendar as CalendarIcon, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@complianceos/ui/ui/button";
import { format } from "date-fns";

interface StrategicRoadmapDetailProps {
    roadmapId: number;
    clientId: number;
    onEdit?: () => void;
}

export default function StrategicRoadmapDetail({ roadmapId, clientId, onEdit }: StrategicRoadmapDetailProps) {
    const { data: roadmap, isLoading } = trpc.roadmap.getStrategic.useQuery({ roadmapId });

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    if (!roadmap) {
        return <div className="p-8 text-center text-muted-foreground">Roadmap not found</div>;
    }

    // Unpack the JSON description if it exists
    let packedData: any = {};
    try {
        if (roadmap.description && roadmap.description.startsWith('{')) {
            packedData = JSON.parse(roadmap.description);
        }
    } catch (e) {
        console.error("Failed to parse roadmap description JSON", e);
    }

    const { businessContext, drivers, posture, metrics, governance, detailedObjectives } = packedData;

    // Fallback if detailedObjectives are missing but standard objectives exist
    const objectives = detailedObjectives || (roadmap.objectives || []).map((t: string) => ({ title: t, priority: 'Medium' }));

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Header Section */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">{roadmap.title}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                            {roadmap.framework || "General Strategy"}
                        </Badge>
                        <span className="text-muted-foreground text-sm">
                            • Target: {roadmap.targetDate ? format(new Date(roadmap.targetDate), 'PPP') : 'Not defined'}
                        </span>
                        <Badge className="ml-2 capitalize bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">
                            {roadmap.status?.replace('_', ' ')}
                        </Badge>
                    </div>
                </div>
                <Button onClick={() => window.location.href = `/clients/${clientId}/roadmap/${roadmapId}/edit`}>
                    Edit Configuration
                </Button>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Main Content Column */}
                <div className="col-span-12 lg:col-span-8 space-y-6">

                    {/* Vision & Context Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary" />
                                Strategic Context
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                    <Building2 className="w-4 h-4" /> Organizational
                                </h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between border-b pb-1 border-dashed">
                                        <span className="text-muted-foreground">Industry</span>
                                        <span className="font-medium">{businessContext?.industry || "Not set"}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-1 border-dashed pt-1">
                                        <span className="text-muted-foreground">Size</span>
                                        <span className="font-medium capitalize">{businessContext?.orgSize || "Not set"}</span>
                                    </div>
                                    <div className="pt-2">
                                        <span className="text-muted-foreground text-xs block mb-1">Strategic Goals</span>
                                        <div className="flex flex-wrap gap-1">
                                            {businessContext?.goals?.map((g: string) => (
                                                <Badge key={g} variant="secondary" className="text-[10px]">{g}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Risk & Posture
                                </h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between border-b pb-1 border-dashed">
                                        <span className="text-muted-foreground">Maturity Level</span>
                                        <span className="font-medium">{posture?.maturityLevel || "Initial"}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-1 border-dashed pt-1">
                                        <span className="text-muted-foreground">Risk Appetite</span>
                                        <span className="font-medium">{businessContext?.riskAppetite ? `${businessContext.riskAppetite}/5` : "Not set"}</span>
                                    </div>
                                    <div className="pt-2">
                                        <span className="text-muted-foreground text-xs block mb-1">Critical Assets</span>
                                        <div className="flex flex-wrap gap-1">
                                            {posture?.keyAssets?.map((a: string) => (
                                                <Badge key={a} variant="outline" className="text-[10px]">{a}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Objectives Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Flag className="w-5 h-5 text-primary" />
                                Strategic Objectives
                            </CardTitle>
                            <CardDescription>
                                Key milestones and deliverables for this roadmap
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {objectives.map((obj: any, i: number) => (
                                <div key={i} className="p-4 border rounded-lg bg-card/50 hover:bg-card transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-semibold text-sm">{obj.title}</h4>
                                        <Badge variant={obj.priority === 'Critical' ? 'destructive' : obj.priority === 'High' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                                            {obj.priority}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                        {obj.alignment && (
                                            <div className="flex items-center gap-1">
                                                <Target className="w-3 h-3" />
                                                <span>Aligns: {obj.alignment}</span>
                                            </div>
                                        )}
                                        {obj.horizon && (
                                            <div className="flex items-center gap-1">
                                                <CalendarIcon className="w-3 h-3" />
                                                <span>{obj.horizon}</span>
                                            </div>
                                        )}
                                        {obj.owner && (
                                            <div className="flex items-center gap-1">
                                                <Flag className="w-3 h-3" />
                                                <span>{obj.owner}</span>
                                            </div>
                                        )}
                                        {obj.estimatedHours && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{obj.estimatedHours}h</span>
                                            </div>
                                        )}
                                    </div>

                                    {obj.linkedRisks && obj.linkedRisks.length > 0 && (
                                        <div className="mt-3 flex gap-2 items-center">
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase">Mitigates:</span>
                                            <div className="flex flex-wrap gap-1">
                                                {obj.linkedRisks.map((r: string) => (
                                                    <Badge key={r} variant="outline" className="text-[10px] h-5 border-warning/30 text-amber-700 bg-amber-50">
                                                        <Shield className="w-2.5 h-2.5 mr-1" />{r}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Column */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Metrics / KPI Card */}
                    <Card>
                        <CardHeader className="pb-3 border-b bg-muted/20">
                            <CardTitle className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> Success Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            {metrics && metrics.length > 0 ? (
                                metrics.map((m: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-gray-700">{m.name}</span>
                                        <div className="text-right">
                                            <span className="block font-bold text-primary">
                                                {m.type === 'Currency' ? '$' : ''}{m.targetValue}{m.type === 'Percentage' ? '%' : ''}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground uppercase">{m.frequency}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No specific KPIs defined.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Governance Card */}
                    <Card>
                        <CardHeader className="pb-3 border-b bg-muted/20">
                            <CardTitle className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                                <Scale className="w-4 h-4" /> Governance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4 text-sm">
                            <div>
                                <span className="text-xs text-muted-foreground block">Review Cadence</span>
                                <span className="font-medium">{governance?.reviewCadence || "Not set"}</span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">Oversight Body</span>
                                <span className="font-medium">{governance?.oversightCommittee || "Not defined"}</span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">Reporting Format</span>
                                <span className="font-medium">{governance?.reportingFormat || "Standard"}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Drivers Card */}
                    <Card>
                        <CardHeader className="pb-3 border-b bg-muted/20">
                            <CardTitle className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Drivers
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4 text-sm">
                            <div>
                                <span className="text-xs text-muted-foreground block">Frameworks</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {drivers?.frameworks?.map((f: string) => (
                                        <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                                    )) || <span className="italic text-muted-foreground">None</span>}
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">Audit Type</span>
                                <span className="font-medium capitalize">{drivers?.auditType || "Standard"}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
