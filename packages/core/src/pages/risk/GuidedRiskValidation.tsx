import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import { Button } from '@complianceos/ui/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@complianceos/ui/ui/card';
import { RiskAssessmentWizard } from '@/components/risk/RiskAssessmentWizard';
import { Shield, ArrowRight, CheckCircle2, ChevronRight, Home } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@complianceos/ui/ui/breadcrumb";

export default function GuidedRiskValidation() {
    const params = useParams<{ clientId: string }>();
    const clientId = params.clientId ? parseInt(params.clientId) : 0;
    const [wizardOpen, setWizardOpen] = useState(false);

    if (!clientId) return (
        <DashboardLayout>
            <div className="p-8 text-center text-destructive">Invalid Client ID</div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="p-8 max-w-5xl mx-auto">
                {/* Breadcrumb Navigation */}
                <Breadcrumb className="mb-6">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={`/clients/${clientId}`}>
                                    <Home className="w-4 h-4" />
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>
                            <ChevronRight className="w-4 h-4" />
                        </BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={`/clients/${clientId}/risks`}>Risk Management</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>
                            <ChevronRight className="w-4 h-4" />
                        </BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Guided Assessment</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-blue-600">Guided Risk Assessment</h1>
                    <p className="text-gray-500 mt-2">A step-by-step assistant to identify, analyze, and treat risks standardizing your compliance posture.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="border-l-4 border-l-blue-600 shadow-md">
                        <CardHeader>
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                                <Shield className="w-6 h-6" />
                            </div>
                            <CardTitle>Start New Assessment</CardTitle>
                            <CardDescription>Launch the wizard to evaluate a new asset, process, or scenario.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Defining Scope & Context
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Analyzing Inherent Risk
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Mapping Controls & Treatment
                                </li>
                            </ul>
                            <Button size="lg" className="w-full" onClick={() => setWizardOpen(true)}>
                                Start Assessment <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-50 dark:bg-gray-800 border-dashed">
                        <CardHeader>
                            <CardTitle className="text-gray-500">Recent Validations</CardTitle>
                            <CardDescription>Continue where you left off (Coming Soon)</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-40 text-gray-400 text-sm">
                            No recent drafts found.
                        </CardContent>
                    </Card>
                </div>

                <RiskAssessmentWizard
                    open={wizardOpen}
                    onOpenChange={setWizardOpen}
                    clientId={clientId}
                    onSuccess={() => {
                        console.log("Assessment Created");
                        setWizardOpen(false);
                    }}
                />
            </div>
        </DashboardLayout>
    );
}
