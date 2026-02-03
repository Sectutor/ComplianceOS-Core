import React from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation, useParams, useSearch } from "wouter";
import { useClientContext } from "@/contexts/ClientContext";
import RoadmapCreateForm from "./RoadmapCreateForm";
import { Button } from "@complianceos/ui/ui/button";
import { ArrowLeft } from "lucide-react";

// This is the page wrapper that provides DashboardLayout
export default function RoadmapCreatePage() {
    const params = useParams();
    const clientIdParam = params.id ? parseInt(params.id, 10) : null;
    const { selectedClientId } = useClientContext();
    const clientId = clientIdParam || selectedClientId;
    const [location, setLocation] = useLocation();

    // Get template from URL query params
    const searchParams = new URLSearchParams(window.location.search);
    const templateId = searchParams.get('template');

    // Map template ID to initial data
    const getTemplateData = (id: string | null) => {
        if (!id) return undefined;

        const templates: Record<string, any> = {
            iso27001: {
                id: 'iso27001',
                title: 'ISO 27001:2022 Certification Roadmap',
                framework: 'ISO 27001',
                vision: 'Achieve global security excellence through ISO 27001 certification.',
            },
            soc2: {
                id: 'soc2',
                title: 'SOC 2 Type II Readiness Roadmap',
                framework: 'SOC 2',
                vision: 'Demonstrate operational security commitment to customers through SOC 2 attestation.',
            },
            hipaa: {
                id: 'hipaa',
                title: 'HIPAA Compliance Foundation Roadmap',
                framework: 'HIPAA',
                vision: 'Ensure 100% patient data privacy and HIPAA regulatory compliance.',
            },
            cmmc: {
                id: 'cmmc',
                title: 'CMMC Level 2 Preparation Roadmap',
                framework: 'CMMC 2.0',
                vision: 'Secure DoD contract eligibility through CMMC Level 2 compliance.',
            }
        };

        return templates[id] || undefined;
    };

    const handleSuccess = (roadmap: any) => {
        setLocation(`/clients/${clientId}/roadmap/${roadmap.id}`);
    };

    const handleCancel = () => {
        setLocation(`/clients/${clientId}/roadmap/dashboard`);
    };

    if (!clientId) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
                    Please select a client to create a roadmap.
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-8 max-w-[1400px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-2 mb-2 text-muted-foreground hover:text-foreground"
                            onClick={handleCancel}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {templateId ? 'Configure Your Roadmap' : 'Create Strategic Roadmap'}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {templateId
                                ? `Starting from ${templateId.toUpperCase()} template. Customize the details below.`
                                : 'Build a custom roadmap from scratch with your vision and objectives.'
                            }
                        </p>
                    </div>
                </div>

                {/* Form Component */}
                <RoadmapCreateForm
                    clientId={clientId}
                    initialData={getTemplateData(templateId)}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                />
            </div>
        </DashboardLayout>
    );
}
