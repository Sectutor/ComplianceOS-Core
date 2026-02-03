
import React, { useEffect, useState } from 'react';
import { trpc } from "@/lib/trpc";
import { Slider } from "@complianceos/ui/ui/slider";
import { Label } from "@complianceos/ui/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@complianceos/ui/ui/switch";

interface TimeInterval {
    label: string;
    key: string;
}

const INTERVALS: TimeInterval[] = [
    { label: "0 - 4 Hours", key: "0-4h" },
    { label: "4 - 24 Hours", key: "4-24h" },
    { label: "1 - 3 Days", key: "1-3d" },
    { label: "3 - 7 Days", key: "3-7d" },
    { label: "> 7 Days", key: ">7d" },
];

export function TimeBasedImpactSliders({ biaId }: { biaId: number }) {
    const { data: assessments, refetch } = trpc.businessContinuity.bia.getImpactAssessments.useQuery({ biaId });
    const saveMutation = trpc.businessContinuity.bia.saveImpactAssessment.useMutation();

    const [impacts, setImpacts] = useState<Record<string, {
        financial: number;
        operational: number;
        reputation: number;
        legal: number;
    }>>({});

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (assessments) {
            const next: typeof impacts = {};
            assessments.forEach(a => {
                next[a.timeInterval] = {
                    financial: a.financialRating || 0,
                    operational: a.operationalRating || 0,
                    reputation: a.reputationRating || 0,
                    legal: a.legalRating || 0
                };
            });
            setImpacts(next);
        }
    }, [assessments]);

    const handleSlackChange = (interval: string, type: 'financial' | 'operational' | 'reputation' | 'legal', value: number[]) => {
        setImpacts(prev => ({
            ...prev,
            [interval]: {
                ...(prev[interval] || { financial: 0, operational: 0, reputation: 0, legal: 0 }),
                [type]: value[0]
            }
        }));
    };

    const handleSave = async (interval: string) => {
        setIsSaving(true);
        const data = impacts[interval];
        if (!data) return;

        try {
            await saveMutation.mutateAsync({
                biaId,
                timeInterval: interval,
                financialRating: data.financial,
                operationalRating: data.operational,
                reputationRating: data.reputation,
                legalRating: data.legal
            });
            toast.success(`Saved impact for ${interval}`);
            refetch();
        } catch (e) {
            toast.error("Failed to save");
        } finally {
            setIsSaving(false);
        }
    };

    const getImpactColor = (val: number) => {
        if (val < 3) return "bg-green-500";
        if (val < 6) return "bg-yellow-500";
        if (val < 8) return "bg-orange-500";
        return "bg-destructive";
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Impact Over Time</h3>
            <p className="text-sm text-muted-foreground">
                Assess how the impact of a disruption escalates over time. Rate from 0 (No Impact) to 10 (Catastrophic).
            </p>

            <div className="grid gap-6">
                {INTERVALS.map(interval => {
                    const data = impacts[interval.key] || { financial: 0, operational: 0, reputation: 0, legal: 0 };
                    const max = Math.max(data.financial, data.operational, data.reputation, data.legal);

                    return (
                        <Card key={interval.key} className="border-l-4" style={{ borderLeftColor: max >= 8 ? '#ef4444' : max >= 5 ? '#f97316' : '#22c55e' }}>
                            <CardHeader className="py-4">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-base">{interval.label}</CardTitle>
                                    <Button size="sm" variant="ghost" onClick={() => handleSave(interval.key)} disabled={isSaving}>
                                        <Save className="w-4 h-4 mr-2" /> Save
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 pb-6">
                                <FormSlider
                                    label="Financial"
                                    value={data.financial}
                                    onChange={(v) => handleSlackChange(interval.key, 'financial', v)}
                                />
                                <FormSlider
                                    label="Operational"
                                    value={data.operational}
                                    onChange={(v) => handleSlackChange(interval.key, 'operational', v)}
                                />
                                <FormSlider
                                    label="Reputation"
                                    value={data.reputation}
                                    onChange={(v) => handleSlackChange(interval.key, 'reputation', v)}
                                />
                                <FormSlider
                                    label="Legal/Compliance"
                                    value={data.legal}
                                    onChange={(v) => handleSlackChange(interval.key, 'legal', v)}
                                />
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

function FormSlider({ label, value, onChange }: { label: string, value: number, onChange: (v: number[]) => void }) {
    const colorClass = value < 4 ? "text-green-600" : value < 7 ? "text-yellow-600" : "text-red-600";

    return (
        <div className="space-y-3">
            <div className="flex justify-between">
                <Label>{label}</Label>
                <span className={`text-xs font-bold ${colorClass}`}>{value}/10</span>
            </div>
            <Slider
                value={[value]}
                max={10}
                step={1}
                onValueChange={onChange}
                className={value >= 8 ? "accent-destructive" : ""}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                <span>None</span>
                <span>Critical</span>
            </div>
        </div>
    );
}
