import React from 'react';
import { useParams, Link } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { trpc } from '@/lib/trpc';
import { Shield, AlertTriangle, ArrowRight, Activity, CheckCircle2 } from 'lucide-react';
import { Button } from '@complianceos/ui/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { Separator } from '@complianceos/ui/ui/separator';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@complianceos/ui/ui/breadcrumb";
import { PageGuide } from "@/components/PageGuide";

export default function CriticalRisksPage() {
    const params = useParams<{ id: string }>();
    const clientId = params.id ? parseInt(params.id) : 0;

    const { data: risks, isLoading } = trpc.risks.getRiskAssessments.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const normalizeValue = (val: any): number => {
        if (!val) return 0;
        const strVal = val.toString().toLowerCase().trim();
        let num = parseInt(strVal.charAt(0));
        if (isNaN(num)) {
            if (strVal.includes('critical') || strVal.includes('extreme')) num = 5;
            else if (strVal.includes('very high')) num = 4;
            else if (strVal.includes('high')) num = 3;
            else if (strVal.includes('medium')) num = 2;
            else if (strVal.includes('low')) num = 1;
        }
        return (num >= 1 && num <= 5) ? num : 0;
    };

    const isCritical = (risk: any) => {
        const inherentScore = normalizeValue(risk.likelihood) * normalizeValue(risk.impact);
        const residualScore = normalizeValue(risk.residualRisk);
        // Logic: Show Critical and High risks that match the dashboard intent
        // Dashboard uses "Unmitigated Critical Risks" usually meaning Inherent High/Critical and not fully treated
        // But let's stick to High/Critical Inherent Score for now as a baseline for "Critical Risks"
        // Or if the user user explicitly said "Critical Risks", usually score >= 15

        return inherentScore >= 15 || residualScore >= 4;
    };

    const criticalRisks = risks?.filter(isCritical) || [];

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center p-12">
                    <div className="animate-pulse flex flex-col items-center">
                        <Activity className="w-10 h-10 text-blue-500 mb-4" />
                        <p className="text-muted-foreground">Loading critical risks...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={`/clients/${clientId}`}>Home</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={`/clients/${clientId}/risks`}>Risk Management</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Critical Risks</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-950 flex items-center gap-2">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                            Critical Risks Attention Required
                        </h1>
                        <p className="text-slate-600 mt-2 text-lg">
                            These risks represent the highest threats to your organization. Immediate mitigation strategies are recommended.
                        </p>
                    </div>
                    <PageGuide
                        title="Critical Risks"
                        description="A focused view of your most dangerous exposure points."
                        rationale="Executives need a 'red alert' dashboard to focus resources on the risks that matter most."
                        howToUse={[
                            { step: "Immediate Action", description: "Everything on this list requires an active, funded treatment plan." },
                            { step: "Residual Risk Check", description: "If a risk is here but has controls, those controls are likely failing or insufficient." },
                            { step: "Review Weekly", description: "This list should be shrinking, not growing." }
                        ]}
                        integrations={[
                            { name: "Risk Register", description: "Sources data from all high-severity assessments." },
                            { name: "Alerting", description: "New critical risks can trigger automated notifications." }
                        ]}
                    />
                    <div className="flex gap-2">
                        <Link href={`/clients/${clientId}/risks/register`}>
                            <Button variant="outline">
                                View Full Register
                            </Button>
                        </Link>
                        <PageGuide
                            title="Critical Risks"
                            description="Prioritized view of high-severity risks that require immediate attention."
                            rationale="Not all risks are created equal. This page filters out the noise to focus on 'Critical' and 'High' risks that exceed your organization's risk tolerance."
                            howToUse={[
                                { step: "Review Cards", description: "Each card displays a critical risk with its score and status." },
                                { step: "Check Recommendations", description: "Read the 'Recommended Action' to understand mitigation steps." },
                                { step: "Take Action", description: "Click 'Manage Risk' to update the treatment plan or assign an owner." }
                            ]}
                            integrations={[
                                { name: "Risk Register", description: "Clicking 'Manage Risk' takes you directly to the full register entry." },
                                { name: "Dashboard", description: "The count of critical risks here drives the red metric on the main dashboard." }
                            ]}
                        />
                    </div>
                </div>

                {criticalRisks.length === 0 ? (
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                            <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />
                            <h2 className="text-2xl font-bold text-green-800">No Critical Risks Found</h2>
                            <p className="text-green-700 mt-2 max-w-md">
                                Great job! You have no risks classified as Critical or High severity at this time.
                            </p>
                            <Link href={`/clients/${clientId}/risks`}>
                                <Button className="mt-6 bg-green-700 hover:bg-green-800 text-white">
                                    Return to Risk Dashboard
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {criticalRisks.map((risk) => (
                            <RiskDetailCard key={risk.id} risk={risk} clientId={clientId} />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function RiskDetailCard({ risk, clientId }: { risk: any, clientId: number }) {
    const l = parseInt(risk.likelihood || '0'); // simplified for display
    const i = parseInt(risk.impact || '0');
    const score = l * i;

    return (
        <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-muted-foreground">
                                {risk.assessmentId}
                            </Badge>
                            <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200">
                                Score: {score} (Critical)
                            </Badge>
                        </div>
                        <CardTitle className="text-xl leading-snug">
                            {risk.threatDescription || "Untitled Risk"}
                        </CardTitle>
                    </div>
                    <Link href={`/clients/${clientId}/risks/register?openRiskId=${risk.id}`}>
                        <Button size="sm" className="gap-2">
                            Manage Risk <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                    <div>
                        <span className="font-semibold text-gray-900 block mb-1">Vulnerability</span>
                        <p className="text-gray-600 bg-slate-50 p-3 rounded-md border border-slate-100">
                            {risk.vulnerabilityDescription || "No vulnerability description provided."}
                        </p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <span className="font-semibold text-gray-900 block mb-1">Recommended Action</span>
                        <p className="text-gray-600 bg-blue-50/50 p-3 rounded-md border border-blue-100 text-blue-900">
                            {risk.recommendedActions || "No specific recommendation."}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="font-semibold text-gray-900 block text-xs uppercase tracking-wide">Likelihood</span>
                            <span className="text-lg font-medium">{risk.likelihood}</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-900 block text-xs uppercase tracking-wide">Impact</span>
                            <span className="text-lg font-medium">{risk.impact}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
            {/* <Separator />
            <CardFooter className="pt-4 bg-slate-50/50 flex justify-between items-center text-sm text-muted-foreground">
                <span>Owner: {risk.riskOwner || 'Unassigned'}</span>
                <span>Status: <span className="capitalize font-medium text-foreground">{risk.status}</span></span>
            </CardFooter> */}
        </Card>
    );
}
