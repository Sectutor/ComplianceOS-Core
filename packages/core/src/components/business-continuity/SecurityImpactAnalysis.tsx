
import React, { useEffect, useState } from 'react';
import { trpc } from "@/lib/trpc";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Shield, Lock, FileCheck, Activity, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@complianceos/ui/ui/badge";

interface SecurityImpactAnalysisProps {
    biaId: number;
}

export function SecurityImpactAnalysis({ biaId }: SecurityImpactAnalysisProps) {
    const { data: bia, refetch } = trpc.businessContinuity.bia.get.useQuery({ id: biaId });
    const saveResponseMutation = trpc.businessContinuity.bia.saveResponse.useMutation();

    const [responses, setResponses] = useState<Record<number, string>>({});
    const [impactLevels, setImpactLevels] = useState<Record<number, string>>({});

    // Filter for Security Questions
    const securityQuestions = bia?.questions?.filter(q => q.category === 'Security') || [];

    useEffect(() => {
        if (securityQuestions.length > 0) {
            const res: any = {};
            const imp: any = {};
            securityQuestions.forEach(q => {
                res[q.id] = q.response || "";
                imp[q.id] = q.impactLevel || "low";
            });
            setResponses(res);
            setImpactLevels(imp);
        }
    }, [bia]);

    const handleSave = async (questionId: number, newLevel?: string) => {
        const currentLevel = newLevel || impactLevels[questionId];
        try {
            await saveResponseMutation.mutateAsync({
                questionId,
                response: responses[questionId] || "",
                impactLevel: currentLevel,
                notes: ""
            });
            toast.success("Security impact saved");
        } catch (e) {
            toast.error("Failed to save");
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-slate-50 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base text-blue-700">
                            <Lock className="w-4 h-4" /> Confidentiality
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-blue-900">
                        Protection against unauthorized access or disclosure of sensitive information.
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-green-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base text-green-700">
                            <FileCheck className="w-4 h-4" /> Integrity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-green-900">
                        Assurance that data is accurate, complete, and not tampered with.
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-orange-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base text-orange-700">
                            <Activity className="w-4 h-4" /> Availability
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-orange-900">
                        Reliability and timely access to data and resources for authorized users.
                    </CardContent>
                </Card>
            </div>

            {securityQuestions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                    <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">CIA Impact Analysis Not Configured</h3>
                    <p className="text-muted-foreground mb-6">Security impact questions are missing for this BIA.</p>
                    <Button variant="outline">
                        Initialize Security Assessment
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">(Requires backend update to add questions)</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {securityQuestions.map(q => (
                        <Card key={q.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base">{q.question}</CardTitle>
                                        <CardDescription>{q.notes}</CardDescription>
                                    </div>
                                    <Select
                                        value={impactLevels[q.id]}
                                        onValueChange={(v) => {
                                            setImpactLevels({ ...impactLevels, [q.id]: v });
                                            handleSave(q.id, v);
                                        }}
                                    >
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="critical">Critical</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Label className="mb-2 block">Impact Description & Justification</Label>
                                <Textarea
                                    className="min-h-[100px]"
                                    placeholder="Describe the impact scenario..."
                                    value={responses[q.id]}
                                    onChange={(e) => setResponses({ ...responses, [q.id]: e.target.value })}
                                    onBlur={() => handleSave(q.id)}
                                />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
