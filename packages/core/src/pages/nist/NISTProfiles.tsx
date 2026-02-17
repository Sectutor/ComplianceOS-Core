import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Info, Target, Check, ArrowRight, Save, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { toast } from "sonner";
import NISTLayout from "./NISTLayout";

export default function NISTProfiles() {
    const { selectedClientId } = useClientContext();

    const [targetTiers, setTargetTiers] = useState<Record<string, number>>({
        'GOVERN': 1,
        'IDENTIFY': 1,
        'PROTECT': 1,
        'DETECT': 1,
        'RESPOND': 1,
        'RECOVER': 1
    });

    const [currentTiers, setCurrentTiers] = useState<Record<string, number>>({
        'GOVERN': 1,
        'IDENTIFY': 1,
        'PROTECT': 1,
        'DETECT': 1,
        'RESPOND': 1,
        'RECOVER': 1
    });

    const [activeMode, setActiveMode] = useState<'current' | 'target'>('target');

    // Fetch tiers from backend
    const { data: nistTiersData, isLoading, refetch } = trpc.maturity.getNistTiers.useQuery(
        { clientId: selectedClientId || 0 },
        { enabled: !!selectedClientId }
    );

    const saveTierMutation = trpc.maturity.saveNistTier.useMutation();

    // Fetch Overall Maturity assessments to get actual implementation progress
    const { data: assessments } = trpc.maturity.getAssessments.useQuery(
        { clientId: selectedClientId || 0, frameworkId: 'nist-csf-2' },
        { enabled: !!selectedClientId }
    );

    // Fetch Framework Data (Requirements) to calculate %
    const { data: frameworkData } = trpc.maturity.getFrameworkData.useQuery(
        { frameworkId: 'nist-csf-2' },
        { enabled: !!selectedClientId }
    );

    const scores = useMemo(() => {
        if (!assessments || !frameworkData) return {} as Record<string, number>;

        const byFunction: Record<string, number> = {};
        const mapping: Record<string, string> = {
            'GOVERN': 'GV',
            'IDENTIFY': 'ID',
            'PROTECT': 'PR',
            'DETECT': 'DE',
            'RESPOND': 'RS',
            'RECOVER': 'RC'
        };

        Object.keys(mapping).forEach(funcName => {
            const funcCode = mapping[funcName];
            const cat = frameworkData.categories.find(c => c.code === funcCode && !c.parentId);
            if (cat) {
                const catReqs = frameworkData.requirements.filter(r => r.categoryId === cat.id);
                const catAchieved = assessments.filter(a => a.isAchieved && catReqs.some(r => r.id === a.requirementId)).length;
                byFunction[funcName] = catReqs.length > 0 ? Math.round((catAchieved / catReqs.length) * 100) : 0;
            } else {
                byFunction[funcName] = 0;
            }
        });

        return byFunction;
    }, [assessments, frameworkData]);

    const autoSuggestTiers = () => {
        if (Object.keys(scores).length === 0) {
            toast.error("Assessment data not yet available", {
                description: "Please complete some CSF assessments first."
            });
            return;
        }

        const newCurrentTiers: Record<string, number> = { ...currentTiers };
        let updatedCount = 0;

        Object.keys(scores).forEach(func => {
            const progress = scores[func];
            let suggestedTier = 1;
            if (progress >= 80) suggestedTier = 4;
            else if (progress >= 50) suggestedTier = 3;
            else if (progress >= 20) suggestedTier = 2;

            if (newCurrentTiers[func] !== suggestedTier) {
                newCurrentTiers[func] = suggestedTier;
                updatedCount++;
            }
        });

        if (updatedCount === 0) {
            toast.info("Tiers are already aligned", {
                description: "Your current tiers accurately reflect your assessment progress."
            });
        } else {
            setCurrentTiers(newCurrentTiers);
            toast.success("Profiles Suggested", {
                description: `Applied ${updatedCount} tier updates based on your current assessment progress.`
            });
        }
    };


    useEffect(() => {
        if (nistTiersData && nistTiersData.length > 0) {
            const current: Record<string, number> = {};
            const target: Record<string, number> = {};

            nistTiersData.forEach((tier: any) => {
                current[tier.functionCode] = tier.currentTier || 1;
                target[tier.functionCode] = tier.targetTier || 1;
            });

            setCurrentTiers(prev => ({ ...prev, ...current }));
            setTargetTiers(prev => ({ ...prev, ...target }));
        }
    }, [nistTiersData]);

    const handleSave = async () => {
        if (!selectedClientId) return;

        try {
            const promises = FUNCTIONS.map(func =>
                saveTierMutation.mutateAsync({
                    clientId: selectedClientId,
                    functionCode: func,
                    currentTier: currentTiers[func],
                    targetTier: targetTiers[func]
                })
            );

            await Promise.all(promises);
            toast.success("Profiles Saved", {
                description: "Your organizational profiles have been updated on the dashboard.",
            });
            refetch();
        } catch (error) {
            toast.error("Failed to save profiles", {
                description: "Please try again.",
            });
        }
    };

    const TIERS = [
        { id: 1, name: "Partial", description: "Risk management is ad hoc and reactive." },
        { id: 2, name: "Risk Informed", description: "Risk management practices are approved but not fully established policy." },
        { id: 3, name: "Repeatable", description: "Risk management practices are formally approved and expressed as policy." },
        { id: 4, name: "Adaptive", description: "Risk management practices are adapted based on lessons learned and predictive indicators." }
    ];

    const FUNCTIONS = ['GOVERN', 'IDENTIFY', 'PROTECT', 'DETECT', 'RESPOND', 'RECOVER'];

    if (isLoading) {
        return (
            <NISTLayout>
                <div className="flex items-center justify-center p-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </NISTLayout>
        );
    }

    return (
        <NISTLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Organizational Profiles</h1>
                        <p className="text-slate-500 max-w-2xl mt-2">
                            Define your Current and Target Implementation Tiers. Profiles help you align your cybersecurity activities with business requirements, risk tolerance, and resources.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as any)} className="w-[300px]">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="current">Current Tiers</TabsTrigger>
                                <TabsTrigger value="target">Target Tiers</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        {activeMode === 'current' && (
                            <Button
                                variant="outline"
                                onClick={autoSuggestTiers}
                                className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Suggest from Assessment
                            </Button>
                        )}

                        <Button
                            size="lg"
                            onClick={handleSave}
                            disabled={saveTierMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                        >
                            {saveTierMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Profiles
                        </Button>
                    </div>
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                    {TIERS.map((tier) => {
                        const isActive = (activeMode === 'current' ? Object.values(currentTiers) : Object.values(targetTiers)).some(t => t === tier.id);

                        // Define specific styles for each tier
                        const tierStyles = {
                            1: {
                                activeBg: "bg-slate-50",
                                activeBorder: "border-slate-300",
                                badgeParams: "bg-slate-600 text-white hover:bg-slate-700",
                                ring: "ring-slate-200",
                                iconColor: "text-slate-500"
                            },
                            2: {
                                activeBg: "bg-blue-50",
                                activeBorder: "border-blue-300",
                                badgeParams: "bg-blue-600 text-white hover:bg-blue-700",
                                ring: "ring-blue-200",
                                iconColor: "text-blue-500"
                            },
                            3: {
                                activeBg: "bg-violet-50",
                                activeBorder: "border-violet-300",
                                badgeParams: "bg-violet-600 text-white hover:bg-violet-700",
                                ring: "ring-violet-200",
                                iconColor: "text-violet-500"
                            },
                            4: {
                                activeBg: "bg-emerald-50",
                                activeBorder: "border-emerald-300",
                                badgeParams: "bg-emerald-600 text-white hover:bg-emerald-700",
                                ring: "ring-emerald-200",
                                iconColor: "text-emerald-500"
                            }
                        }[tier.id as 1 | 2 | 3 | 4];

                        return (
                            <Card key={tier.id} className={cn(
                                "transition-all duration-300 relative overflow-hidden",
                                isActive
                                    ? `${tierStyles.activeBg} ${tierStyles.activeBorder} shadow-md ring-1 ${tierStyles.ring}`
                                    : "bg-slate-50/50 border-slate-200 opacity-60 grayscale-[0.5]"
                            )}>
                                {isActive && (
                                    <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full opacity-10 blur-xl", tierStyles.badgeParams.split(' ')[0])} />
                                )}
                                <CardHeader className="pb-2 relative z-10">
                                    <Badge variant="default" className={cn(
                                        "w-fit mb-2 border-0",
                                        isActive ? tierStyles.badgeParams : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                                    )}>Tier {tier.id}</Badge>
                                    <CardTitle className={cn("text-lg", isActive && tierStyles.iconColor.replace('text-', 'text-'))}>{tier.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <p className="text-sm text-slate-500 leading-relaxed">{tier.description}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Profile Matrix</CardTitle>
                                <CardDescription>Click to set the {activeMode} tier for each NIST Function.</CardDescription>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300" />
                                    Current
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200" />
                                    Target
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold text-[10px] tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Function</th>
                                        {TIERS.map(t => (
                                            <th key={t.id} className="px-6 py-4 text-center">
                                                Tier {t.id} <br />
                                                <span className="font-normal normal-case opacity-70">{t.name}</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {FUNCTIONS.map((func) => (
                                        <tr key={func} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="px-6 py-8">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-2 h-8 rounded-full",
                                                        func === 'GOVERN' && "bg-blue-500",
                                                        func === 'IDENTIFY' && "bg-purple-500",
                                                        func === 'PROTECT' && "bg-emerald-500",
                                                        func === 'DETECT' && "bg-amber-500",
                                                        func === 'RESPOND' && "bg-rose-500",
                                                        func === 'RECOVER' && "bg-cyan-500",
                                                    )} />
                                                    <span className="font-bold text-slate-900 tracking-tight">{func}</span>
                                                </div>
                                            </td>
                                            {TIERS.map((tier) => {
                                                const isCurrent = currentTiers[func] === tier.id;
                                                const isTarget = targetTiers[func] === tier.id;

                                                const tierColor = {
                                                    1: { bg: "bg-slate-50", border: "border-slate-300", ring: "ring-slate-400", solid: "bg-slate-500" },
                                                    2: { bg: "bg-blue-50", border: "border-blue-300", ring: "ring-blue-500", solid: "bg-blue-500" },
                                                    3: { bg: "bg-violet-50", border: "border-violet-300", ring: "ring-violet-500", solid: "bg-violet-500" },
                                                    4: { bg: "bg-emerald-50", border: "border-emerald-300", ring: "ring-emerald-500", solid: "bg-emerald-500" }
                                                }[tier.id as 1 | 2 | 3 | 4];

                                                return (
                                                    <td key={tier.id} className="px-4 py-4 text-center">
                                                        <div
                                                            className={cn(
                                                                "w-full h-16 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group relative overflow-hidden",
                                                                "border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50/50",
                                                                isCurrent && !isTarget && `${tierColor.bg} border-solid ${tierColor.border}`,
                                                                isTarget && !isCurrent && `${tierColor.bg} border-solid ${tierColor.border} opacity-80`,
                                                                isCurrent && isTarget && `${tierColor.bg} border-solid ${tierColor.border} shadow-sm`,
                                                                // Active focus ring
                                                                (activeMode === 'current' ? isCurrent : isTarget) && `ring-2 ${tierColor.ring} ring-offset-2 shadow-md`
                                                            )}
                                                            onClick={() => {
                                                                if (activeMode === 'current') {
                                                                    setCurrentTiers({ ...currentTiers, [func]: tier.id });
                                                                } else {
                                                                    setTargetTiers({ ...targetTiers, [func]: tier.id });
                                                                }
                                                            }}
                                                        >
                                                            {isCurrent && isTarget && (
                                                                <div className={cn("absolute inset-0 opacity-10 blur-sm", tierColor.solid)} />
                                                            )}

                                                            <div className="flex gap-1.5 z-10">

                                                                {isCurrent && (
                                                                    <div className={cn(
                                                                        "w-2.5 h-2.5 rounded-full shadow-sm transition-transform group-hover:scale-110",
                                                                        isTarget ? "bg-slate-700" : tierColor.solid
                                                                    )} title="Current Tier" />
                                                                )}
                                                                {isTarget && (
                                                                    <div className={cn(
                                                                        "w-2.5 h-2.5 rounded-full shadow-sm transition-transform group-hover:scale-110 ring-2 ring-white",
                                                                        tierColor.solid
                                                                    )} title="Target Tier" />
                                                                )}
                                                            </div>
                                                            <span className={cn(
                                                                "text-[10px] font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity z-10",
                                                                tierColor.solid.replace('bg-', 'text-')
                                                            )}>
                                                                Set {activeMode}
                                                            </span>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Gap Analysis</CardTitle>
                            <CardDescription>Functions requiring improvement to reach target levels.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {FUNCTIONS.map(func => {
                                const gap = targetTiers[func] - currentTiers[func];
                                if (gap <= 0) return null;

                                const targetTierId = targetTiers[func] as 1 | 2 | 3 | 4;
                                const targetColor = {
                                    1: "text-slate-600",
                                    2: "text-blue-600",
                                    3: "text-violet-600",
                                    4: "text-emerald-600"
                                }[targetTierId];

                                return (
                                    <div key={func} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-md shadow-sm border border-slate-100 group-hover:border-slate-200">
                                                <Target className={cn("h-4 w-4", targetColor)} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-slate-700">{func}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <span>Tier {currentTiers[func]}</span>
                                                    <ArrowRight className="h-3 w-3 text-slate-300" />
                                                    <span className={cn("font-medium", targetColor)}>Tier {targetTiers[func]}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 shadow-sm">
                                            +{gap} Level{gap > 1 ? 's' : ''}
                                        </Badge>
                                    </div>
                                );
                            })}

                            {Object.keys(targetTiers).every(f => targetTiers[f] <= currentTiers[f]) && (
                                <div className="text-center py-8 text-slate-500">
                                    <Check className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                                    <p className="font-medium text-slate-900">All targets achieved!</p>
                                    <p className="text-xs">Your current implementation tiers align with your organizational goals.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-600 text-white border-none overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Target className="w-32 h-32" />
                        </div>
                        <CardHeader>
                            <CardTitle>Strategy Insights</CardTitle>
                            <CardDescription className="text-blue-100">Based on your target tiers.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                            <p className="text-sm text-blue-50 leading-relaxed">
                                Increasing your maturity to <strong>Repeatable (Tier 3)</strong> across GOVERN and IDENTIFY will significantly improve your compliance posture for NIST 800-53 and ISO 27001.
                            </p>
                            <div className="pt-4 border-t border-blue-500/50">
                                <h4 className="text-xs font-bold uppercase tracking-widest mb-3 opacity-70">Recommended Next Steps</h4>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2 text-sm">
                                        <Check className="h-4 w-4 mt-0.5 text-blue-200" />
                                        <span>Formally document risk management policies</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                        <Check className="h-4 w-4 mt-0.5 text-blue-200" />
                                        <span>Define department-wide roles and responsibilities</span>
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </NISTLayout>
    );
}
