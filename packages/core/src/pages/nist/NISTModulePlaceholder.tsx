
import React from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import {
    Construction,
    ArrowLeft,
    Shield,
    Lock,
    GitBranch,
    Target,
    ClipboardList,
    ShieldCheck,
    LayoutGrid,
    Activity
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";

interface NISTModulePlaceholderProps {
    title: string;
    description: string;
    icon: React.ElementType;
    standard?: string;
}

export default function NISTModulePlaceholder({ title, description, icon: Icon, standard = "NIST Ecosystem" }: NISTModulePlaceholderProps) {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [, setLocation] = useLocation();

    return (
        <DashboardLayout>
            <div className="space-y-10 pb-20 px-6">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "NIST Hub", href: `/clients/${clientId}/nist` },
                        { label: title },
                    ]}
                />

                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 max-w-2xl mx-auto">
                    <div className="relative">
                        <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 shadow-xl relative z-10">
                            <Icon className="w-12 h-12" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shadow-lg z-20 animate-bounce">
                            <Construction className="w-6 h-6" />
                        </div>
                        <div className="absolute top-0 left-0 w-24 h-24 bg-blue-400/20 rounded-3xl blur-2xl -z-10 animate-pulse" />
                    </div>

                    <div className="space-y-4">
                        <div className="inline-flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            <Shield className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{standard}</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">{title}</h1>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            {description}
                        </p>
                    </div>

                    <Card className="w-full border-2 border-dashed border-blue-200 bg-blue-50/30">
                        <CardContent className="p-8 space-y-4">
                            <h3 className="font-bold text-blue-900 flex items-center justify-center gap-2">
                                <ShieldCheck className="w-5 h-5" />
                                Standard Integration
                            </h3>
                            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full w-1/4 bg-blue-500 rounded-full animate-progress" />
                            </div>
                            <p className="text-sm text-blue-700 font-medium">
                                Data schema defined. Workflow mapping in progress for this NIST publication.
                            </p>
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => window.history.back()}
                            className="rounded-xl px-8"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </Button>
                        <Button
                            onClick={() => setLocation(`/clients/${clientId}/nist`)}
                            className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8"
                        >
                            Back to Hub
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

// Helper components for specific NIST standards
export const NistRmfPlaceholder = () => (
    <NISTModulePlaceholder
        title="NIST SP 800-37 (RMF)"
        description="Operationalize the 7-step Risk Management Framework lifecycle. Track systems from Preparation through Authorization and Continuous Monitoring."
        icon={GitBranch}
        standard="NIST RMF"
    />
);

export const Nist80030Placeholder = () => (
    <NISTModulePlaceholder
        title="NIST SP 800-30"
        description="Detailed risk assessment methodology. Conduct threat modeling, vulnerability analysis, and impact assessment following NIST guidelines."
        icon={Target}
        standard="NIST 800-30"
    />
);

export const Nist80053Placeholder = () => (
    <NISTModulePlaceholder
        title="NIST SP 800-53"
        description="Deep dive into the Security and Privacy Control Catalog. Manage baselines, control inheritance, and technical implementation evidence."
        icon={Lock}
        standard="NIST 800-53"
    />
);
