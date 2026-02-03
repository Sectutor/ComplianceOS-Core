
import { RecoveryRequirementsEditor } from "@/components/business-continuity/RecoveryRequirementsEditor";
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { ArrowLeft, Loader2, Save, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@complianceos/ui/ui/badge";
import { ApprovalBanner } from "@/components/ApprovalBanner";
import { BCCommentsSection } from "@/components/BCCommentsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { TimeBasedImpactSliders } from "@/components/business-continuity/TimeBasedImpactSliders";
import { FinancialImpactCalculator } from "@/components/business-continuity/FinancialImpactCalculator";
import { Input } from "@complianceos/ui/ui/input";
import { SecurityImpactAnalysis } from "@/components/business-continuity/SecurityImpactAnalysis";
import { BiaSeasonalityContext, BiaVitalRecords } from "@/components/business-continuity/BiaContextComponents";

export default function BusinessImpactAnalysisEditor() {
    const params = useParams();
    const biaId = parseInt(params.biaId || "0");
    const clientId = parseInt(params.id || "0");

    const { data: bia, isLoading, refetch } = trpc.businessContinuity.bia.get.useQuery({ id: biaId, clientId }, { enabled: !!biaId && !!clientId });
    const updateStatusMutation = trpc.businessContinuity.bia.updateStatus.useMutation();
    const saveResponseMutation = trpc.businessContinuity.bia.saveResponse.useMutation();

    const [responses, setResponses] = useState<Record<number, string>>({});
    const [notes, setNotes] = useState<Record<number, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (bia?.questions) {
            const initialResponses: Record<number, string> = {};
            const initialNotes: Record<number, string> = {};
            bia.questions.forEach(q => {
                if (q.response) initialResponses[q.id] = q.response;
                if (q.notes) initialNotes[q.id] = q.notes;
            });
            setResponses(initialResponses);
            setNotes(initialNotes);
        }
    }, [bia]);

    const handleSaveResponse = async (questionId: number) => {
        setIsSaving(true);
        try {
            await saveResponseMutation.mutateAsync({
                questionId,
                response: responses[questionId] || "",
                notes: notes[questionId] || ""
            });
            toast.success("Response saved");
        } catch (error) {
            toast.error("Failed to save response");
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            await updateStatusMutation.mutateAsync({ id: biaId, status: newStatus, clientId });
            toast.success(`BIA marked as ${newStatus}`);
            refetch();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-screen">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (!bia) {
        return (
            <DashboardLayout>
                <div className="p-8">BIA not found.</div>
            </DashboardLayout>
        );
    }

    // Group questions by category
    const questionsByCategory = bia.questions.reduce((acc, q) => {
        if (!acc[q.category || 'General']) acc[q.category || 'General'] = [];
        acc[q.category || 'General'].push(q);
        return acc;
    }, {} as Record<string, typeof bia.questions>);

    return (
        <DashboardLayout>
            <div className="p-8 max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/clients/${clientId}/business-continuity/bia`}>
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{bia.title}</h1>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span>Status:</span>
                                <Badge variant={bia.status === 'approved' ? 'default' : 'secondary'}>{bia.status}</Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* Approval handled by ApprovalBanner */}
                    </div>
                </div>

                <ApprovalBanner entityType="bia" entityId={biaId} />

                <div className="space-y-6">

                    <Tabs defaultValue="questionnaire" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="questionnaire">1. Qualitative</TabsTrigger>
                            <TabsTrigger value="context">2. Context & SPOF</TabsTrigger>
                            <TabsTrigger value="timebased">3. Time-Based</TabsTrigger>
                            <TabsTrigger value="financial">4. Financial</TabsTrigger>
                            <TabsTrigger value="records">5. Vital Records</TabsTrigger>
                            <TabsTrigger value="security">6. Security (CIA)</TabsTrigger>
                            <TabsTrigger value="recovery">7. Recovery (RTO)</TabsTrigger>
                        </TabsList>

                        <TabsContent value="questionnaire" className="mt-6 space-y-6">
                            {Object.entries(questionsByCategory).map(([category, questions]) => (
                                <Card key={category}>
                                    <CardHeader>
                                        <CardTitle>{category} Impact</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {questions.map((q) => (
                                            <div key={q.id} className="p-4 border rounded-lg space-y-3 bg-card">
                                                <div className="flex justify-between items-start">
                                                    <Label className="text-base font-medium">{q.question}</Label>
                                                    <Badge variant="outline">{q.impactLevel} Impact</Badge>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground">Response</Label>
                                                    <Textarea
                                                        placeholder="Describe the impact..."
                                                        value={responses[q.id] || ""}
                                                        onChange={(e) => setResponses({ ...responses, [q.id]: e.target.value })}
                                                        onBlur={() => handleSaveResponse(q.id)}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground">Notes / Mitigation</Label>
                                                    <Input
                                                        value={notes[q.id] || ""}
                                                        onChange={(e) => setNotes({ ...notes, [q.id]: e.target.value })}
                                                        onBlur={() => handleSaveResponse(q.id)}
                                                        className="h-8"
                                                        placeholder="Additional notes..."
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>

                        <TabsContent value="context" className="mt-6">
                            <BiaSeasonalityContext biaId={biaId} />
                        </TabsContent>

                        <TabsContent value="timebased" className="mt-6">
                            <TimeBasedImpactSliders biaId={biaId} />
                        </TabsContent>

                        <TabsContent value="financial" className="mt-6">
                            <FinancialImpactCalculator biaId={biaId} />
                        </TabsContent>

                        <TabsContent value="records" className="mt-6">
                            <BiaVitalRecords biaId={biaId} />
                        </TabsContent>

                        <TabsContent value="security" className="mt-6">
                            <SecurityImpactAnalysis biaId={biaId} />
                        </TabsContent>

                        <TabsContent value="recovery" className="mt-6">
                            <RecoveryRequirementsEditor biaId={biaId} />
                        </TabsContent>
                    </Tabs>
                </div>


                <BCCommentsSection entityType="bia" entityId={biaId} />
            </div>
        </DashboardLayout>
    );
}


