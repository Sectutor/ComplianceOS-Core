
import React, { useState } from 'react';
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Breadcrumb } from "@/components/Breadcrumb";

import {
    PlanDetailsTab,
    PlanStrategiesTab,
    PlanActivitiesTab,
    PlanContactsTab,
    PlanReviewTab
} from "@/components/business-continuity/plans/PlanTabs";

interface SelectedStakeholder {
    id: number;
    name: string;
    email: string;
    role: string;
}

export default function RecoveryPlanBuilder() {
    const [, setLocation] = useLocation();
    const [_, params] = useRoute("/clients/:clientId/business-continuity/plans/new");
    const clientId = params?.clientId ? parseInt(params.clientId) : 0;

    const [activeTab, setActiveTab] = useState("details");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        title: "",
        version: "1.0",
        department: "",
        selectedStrategyIds: [] as number[],
        selectedScenarioIds: [] as number[],
        selectedBiaIds: [] as number[],
        selectedStakeholders: [] as SelectedStakeholder[],
    });

    // Fetches
    const { data: strategies } = trpc.businessContinuity.strategies.list.useQuery({ clientId }, { enabled: !!clientId });
    const { data: scenarios } = trpc.businessContinuity.scenarios.list.useQuery({ clientId });
    const { data: bias } = trpc.businessContinuity.bia.list.useQuery({ clientId }, { enabled: !!clientId });
    const { data: availableUsers } = trpc.businessContinuity.stakeholders.searchCandidates.useQuery({});

    // Fetch critical activities for selected BIAs
    const { data: criticalActivities } = trpc.businessContinuity.bia.getActivitiesForBias.useQuery(
        { biaIds: formData.selectedBiaIds },
        { enabled: formData.selectedBiaIds.length > 0 }
    );

    const createPlan = trpc.businessContinuity.plans.create.useMutation({
        onSuccess: () => {
            toast.success("Plan created successfully");
            setLocation(`/clients/${clientId}/business-continuity/plans`);
        },
        onError: (err) => toast.error(err.message)
    });

    const toggleStrategy = (id: number) => {
        setFormData(prev => ({
            ...prev,
            selectedStrategyIds: prev.selectedStrategyIds.includes(id)
                ? prev.selectedStrategyIds.filter(x => x !== id)
                : [...prev.selectedStrategyIds, id]
        }));
    };

    const toggleBia = (id: number) => {
        setFormData(prev => ({
            ...prev,
            selectedBiaIds: prev.selectedBiaIds.includes(id)
                ? prev.selectedBiaIds.filter(x => x !== id)
                : [...prev.selectedBiaIds, id]
        }));
    };

    const toggleScenario = (id: number) => {
        setFormData(prev => ({
            ...prev,
            selectedScenarioIds: prev.selectedScenarioIds.includes(id)
                ? prev.selectedScenarioIds.filter(x => x !== id)
                : [...prev.selectedScenarioIds, id]
        }));
    };

    const addStakeholder = (user: { id: number, name: string, email: string }) => {
        if (formData.selectedStakeholders.find(s => s.id === user.id)) return;
        setFormData(prev => ({
            ...prev,
            selectedStakeholders: [...prev.selectedStakeholders, { ...user, role: "Plan Member" }]
        }));
    };

    const removeStakeholder = (id: number) => {
        setFormData(prev => ({
            ...prev,
            selectedStakeholders: prev.selectedStakeholders.filter(s => s.id !== id)
        }));
    };

    const updateStakeholderRole = (id: number, role: string) => {
        setFormData(prev => ({
            ...prev,
            selectedStakeholders: prev.selectedStakeholders.map(s => s.id === id ? { ...s, role } : s)
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const selectedStrategies = strategies?.filter(s => formData.selectedStrategyIds.includes(s.id));
            const selectedScenarios = scenarios?.filter(s => formData.selectedScenarioIds.includes(s.id));
            const selectedBias = bias?.filter(b => formData.selectedBiaIds.includes(b.id));

            const content = JSON.stringify({
                metadata: {
                    department: formData.department,
                    generatedAt: new Date().toISOString()
                },
                strategies: selectedStrategies,
                scenarios: selectedScenarios,
                bias: selectedBias,
                criticalActivities: criticalActivities || [],
                callList: formData.selectedStakeholders
            }, null, 2);

            await createPlan.mutateAsync({
                clientId,
                title: formData.title,
                version: formData.version,
                status: "draft",
                content: content,
                biaIds: formData.selectedBiaIds,
                strategyIds: formData.selectedStrategyIds,
                scenarioIds: formData.selectedScenarioIds,
            });
        } catch (e: any) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto py-8 px-4">
                <div className="mb-6">
                    <Breadcrumb
                        items={[
                            { label: "Clients", href: "/clients" },
                            { label: "Business Continuity", href: `/clients/${clientId}/business-continuity` },
                            { label: "Recovery Plans", href: `/clients/${clientId}/business-continuity/plans` },
                            { label: "New Plan", href: `/clients/${clientId}/business-continuity/plans/new` },
                        ]}
                    />
                    <div className="flex items-center mt-2">
                        <Button variant="ghost" size="sm" className="-ml-3" onClick={() => setLocation(`/clients/${clientId}/business-continuity/plans`)}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Plans
                        </Button>
                    </div>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold">New Recovery Plan</h1>
                    <p className="text-muted-foreground mt-2">Generate a comprehensive BCP document using existing data.</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="details">1. Details</TabsTrigger>
                        <TabsTrigger value="strategies">2. Strategies</TabsTrigger>
                        <TabsTrigger value="activities">3. Activities</TabsTrigger>
                        <TabsTrigger value="contacts">4. Contacts</TabsTrigger>
                        <TabsTrigger value="review">5. Review</TabsTrigger>
                    </TabsList>

                    <Card>
                        <CardContent className="pt-6">
                            <TabsContent value="details" className="mt-0">
                                <PlanDetailsTab
                                    formData={formData}
                                    setFormData={setFormData}
                                    onNext={() => setActiveTab("strategies")}
                                />
                            </TabsContent>

                            <TabsContent value="strategies" className="mt-0">
                                <PlanStrategiesTab
                                    formData={formData}
                                    toggleStrategy={toggleStrategy}
                                    toggleScenario={toggleScenario}
                                    strategies={strategies || []}
                                    scenarios={scenarios || []}
                                    onBack={() => setActiveTab("details")}
                                    onNext={() => setActiveTab("activities")}
                                />
                            </TabsContent>

                            <TabsContent value="activities" className="mt-0">
                                <PlanActivitiesTab
                                    formData={formData}
                                    toggleBia={toggleBia}
                                    bias={bias || []}
                                    onBack={() => setActiveTab("strategies")}
                                    onNext={() => setActiveTab("contacts")}
                                />
                            </TabsContent>

                            <TabsContent value="contacts" className="mt-0">
                                <PlanContactsTab
                                    formData={formData}
                                    availableUsers={availableUsers || []}
                                    addStakeholder={addStakeholder}
                                    removeStakeholder={removeStakeholder}
                                    updateStakeholderRole={updateStakeholderRole}
                                    onBack={() => setActiveTab("activities")}
                                    onNext={() => setActiveTab("review")}
                                />
                            </TabsContent>

                            <TabsContent value="review" className="mt-0">
                                <PlanReviewTab
                                    formData={formData}
                                    strategies={strategies || []}
                                    criticalActivities={criticalActivities || []}
                                    isSubmitting={isSubmitting}
                                    onSubmit={handleSubmit}
                                    onBack={() => setActiveTab("contacts")}
                                />
                            </TabsContent>
                        </CardContent>
                    </Card>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
