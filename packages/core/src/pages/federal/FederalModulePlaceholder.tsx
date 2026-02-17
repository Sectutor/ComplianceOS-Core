
import React from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import {
    Construction,
    ArrowLeft,
    Shield,
    Lock,
    Cloud,
    GitBranch,
    Target,
    ClipboardList,
    ShieldCheck,
    Server,
    Key
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";

interface FederalModulePlaceholderProps {
    title: string;
    description: string;
    icon: React.ElementType;
    framework?: string;
}

export default function FederalModulePlaceholder({ title, description, icon: Icon, framework = "US Federal Compliance" }: FederalModulePlaceholderProps) {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [, setLocation] = useLocation();

    return (
        <DashboardLayout>
            <div className="space-y-10 pb-20 px-6">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Federal Compliance", href: `/clients/${clientId}/federal` },
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
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{framework}</span>
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
                                Implementation Progress
                            </h3>
                            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full w-1/4 bg-blue-500 rounded-full animate-progress" />
                            </div>
                            <p className="text-sm text-blue-700 font-medium">
                                Module structure is defined. Component implementation in progress.
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
                            onClick={() => setLocation(`/clients/${clientId}/federal`)}
                            className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8"
                        >
                            Federal Overview
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

// Helper components for specific modules
export const FedRAMPPlaceholder = () => (
    <FederalModulePlaceholder
        title="FedRAMP Packages"
        description="Streamline the FedRAMP authorization process with automated System Security Plan (SSP) generation, Security Assessment Plans (SAP), and continuous monitoring workflows for Low, Moderate, and High baselines."
        icon={Cloud}
        framework="FedRAMP"
    />
);

export const NIST80053Placeholder = () => (
    <FederalModulePlaceholder
        title="NIST 800-53 Rev 5"
        description="Comprehensive control catalog and assessment module for the NIST SP 800-53 Revision 5 security and privacy control framework. Required for FISMA and agency-level federal compliance."
        icon={ShieldCheck}
        framework="FISMA"
    />
);

export const FISMAPlaceholder = () => (
    <FederalModulePlaceholder
        title="FISMA Reporting"
        description="Automated reporting and dashboarding for Federal Information Security Modernization Act (FISMA) compliance, including quarterly and annual performance metrics for agency submission."
        icon={ClipboardList}
        framework="FISMA"
    />
);

export const RMFPlaceholder = () => (
    <FederalModulePlaceholder
        title="RMF Workflow"
        description="Guided 7-step Risk Management Framework (NIST SP 800-37) lifecycle orchestrator. Track your system from Preparation through Authorize and Continuous Monitoring phases."
        icon={GitBranch}
        framework="NIST RMF"
    />
);

export const DFARSPlaceholder = () => (
    <FederalModulePlaceholder
        title="DFARS/SPRS Scoring"
        description="Calculate your NIST 800-171 assessment score following the DoD Assessment Methodology. Generate and track Supplier Performance Risk System (SPRS) scoring for defense contract eligibility."
        icon={Target}
        framework="CMMC / DFARS"
    />
);

export const DISAStigPlaceholder = () => (
    <FederalModulePlaceholder
        title="DISA STIG Checklists"
        description="Security Technical Implementation Guides (STIGs) provide checklists and automation for hardening servers, databases, and network devices to Department of Defense (DOD) standards."
        icon={Server}
        framework="DISA STIG"
    />
);

export const Fips140TrackingPlaceholder = () => (
    <FederalModulePlaceholder
        title="FIPS 140-3 Cryptography Tracking"
        description="Track and verify that all cryptographic modules in use within your information system are NIST-validated and meet FIPS 140-2 or 140-3 requirements."
        icon={Key}
        framework="FIPS 140"
    />
);
