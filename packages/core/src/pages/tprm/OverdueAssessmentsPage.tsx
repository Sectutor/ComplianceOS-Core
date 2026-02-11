import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Loader2, AlertCircle, ArrowRight, CheckCircle2, Home, ChevronRight, ShieldAlert } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@complianceos/ui/ui/breadcrumb";
import { PageGuide } from "@/components/PageGuide";

export default function OverdueAssessmentsPage() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [searchTerm, setSearchTerm] = useState("");

    const { data: assessments, isLoading } = trpc.vendorAssessments.listAll.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const getOverdueAssessments = () => {
        if (!assessments) return [];
        return assessments.filter((a: any) => {
            const isCompleted = a.status?.toLowerCase() === 'completed';
            if (isCompleted) return false;

            const daysLeft = a.dueDate ? differenceInDays(new Date(a.dueDate), new Date()) : null;
            return daysLeft !== null && daysLeft < 0;
        });
    };

    const overdueAssessments = getOverdueAssessments();

    const getRiskColor = (criticality: string | null) => {
        switch (criticality) {
            case 'High': return 'text-rose-600 bg-rose-50 border-rose-200';
            case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200';
            default: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                        <p className="text-muted-foreground">Loading overdue assessments...</p>
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
                                <Link href={`/clients/${clientId}/vendors`}>Vendor Management</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Overdue Assessments</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex items-start justify-between animate-slide-down">
                    <PageGuide
                        title="Overdue Vendor Assessments"
                        description="Track and resolve assessments that have missed their due dates."
                        rationale="Timely assessment completion is critical for continuous monitoring compliance (ISO 27001 / SOC 2)."
                        howToUse={[
                            { step: "Review", description: "Identify vendors with overdue assessments and their risk level." },
                            { step: "Contact", description: "Follow up with vendors to expedite response submission." },
                            { step: "Resolve", description: "Review late submissions or escalate non-responsive vendors." }
                        ]}
                    />
                    <Link href={`/clients/${clientId}/vendors`}>
                        <Button variant="outline">
                            View All Vendors
                        </Button>
                    </Link>
                </div>

                {overdueAssessments.length === 0 ? (
                    <Card className="bg-green-50 border-green-200 mt-8">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                            <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />
                            <h2 className="text-2xl font-bold text-green-800">No Overdue Assessments</h2>
                            <p className="text-green-700 mt-2 max-w-md">
                                Excellent! All vendor assessments are on track or completed.
                            </p>
                            <Link href={`/clients/${clientId}/vendors`}>
                                <Button className="mt-6 bg-green-700 hover:bg-green-800 text-white">
                                    Return to Vendor Management
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 mt-6">
                        {overdueAssessments.map((assessment: any) => {
                            const daysLeft = assessment.dueDate ? differenceInDays(new Date(assessment.dueDate), new Date()) : 0;

                            return (
                                <Card key={assessment.id} className="border-l-4 shadow-sm hover:shadow-md transition-shadow" style={{
                                    borderLeftColor: assessment.vendorCriticality === 'High' ? '#e11d48' : assessment.vendorCriticality === 'Medium' ? '#d97706' : '#ef4444'
                                }}>
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-semibold text-slate-900">{assessment.vendorName}</h3>
                                                    <Badge variant="outline" className={cn("text-xs", getRiskColor(assessment.vendorCriticality))}>
                                                        {assessment.vendorCriticality} Risk
                                                    </Badge>
                                                </div>
                                                <p className="text-sm font-medium text-slate-700">{assessment.type}</p>
                                                <div className="flex items-center gap-2 text-sm text-red-600 font-semibold bg-red-50 w-fit px-2 py-1 rounded">
                                                    <AlertCircle className="w-4 h-4" />
                                                    Overdue by {Math.abs(daysLeft)} days (Due: {format(new Date(assessment.dueDate), 'MMM d, yyyy')})
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-3 min-w-[150px]">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                                    Status: {assessment.status}
                                                </Badge>
                                                <Link href={`/clients/${clientId}/vendors/${assessment.vendorId}?tab=assessments`}>
                                                    <Button className="w-full gap-2">
                                                        Resolve <ArrowRight className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
