import React from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Shield, Lock, FileText, CheckCircle2, ArrowRight, Plus, ArrowLeft, Target, Zap, Building2 } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useClientContext } from "@/contexts/ClientContext";

const TEMPLATES = [
    {
        id: 'iso27001',
        title: 'ISO 27001:2022 Certification',
        framework: 'ISO 27001',
        description: 'Comprehensive roadmap for establishing, implementing, maintaining and continually improving an ISMS.',
        vision: 'Achieve global security excellence through ISO 27001 certification.',
        objectives: [
            'Define ISMS Scope and Policy',
            'Conduct comprehensive Risk Assessment',
            'Implement Annex A Controls',
            'Conduct Internal Audit & Management Review',
            'Successfully complete Phase 1 & 2 Certification Audits'
        ],
        kpiTargets: [
            { name: 'Control Implementation', target: 100, unit: '%' },
            { name: 'Risk Mitigation Rate', target: 90, unit: '%' }
        ],
        icon: Shield,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        gradient: 'from-blue-500 to-indigo-600'
    },
    {
        id: 'soc2',
        title: 'SOC 2 Type II Readiness',
        framework: 'SOC 2',
        description: 'Preparation roadmap focusing on Security, Availability, and Confidentiality Trust Services Criteria.',
        vision: 'Demonstrate operational security commitment to customers through SOC 2 attestation.',
        objectives: [
            'Identity Trust Services Criteria gap areas',
            'Formalize security policies and procedures',
            'Collect operational evidence over 3-6 months',
            'Engage CPA firm for examination',
            'Achieve clean SOC 2 Type II report'
        ],
        kpiTargets: [
            { name: 'Evidence Collection Rate', target: 100, unit: '%' },
            { name: 'Policy Adherence', target: 100, unit: '%' }
        ],
        icon: Lock,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        gradient: 'from-purple-500 to-pink-600'
    },
    {
        id: 'hipaa',
        title: 'HIPAA Compliance Foundation',
        framework: 'HIPAA',
        description: 'Strategic planning for protecting PHI through Administrative, Physical, and Technical safeguards.',
        vision: 'Ensure 100% patient data privacy and HIPAA regulatory compliance.',
        objectives: [
            'Designate Privacy & Security Officers',
            'Perform HIPAA Security Risk Analysis',
            'Implement PHI encryption and access controls',
            'Train all staff on HIPAA Privacy Rule',
            'Establish Breach Notification Procedure'
        ],
        kpiTargets: [
            { name: 'Staff Training %', target: 100, unit: '%' },
            { name: 'Encryption Coverage', target: 100, unit: '%' }
        ],
        icon: FileText,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        gradient: 'from-emerald-500 to-teal-600'
    },
    {
        id: 'cmmc',
        title: 'CMMC Level 2 Preparation',
        framework: 'CMMC 2.0',
        description: 'Defense contractor readiness roadmap for Cybersecurity Maturity Model Certification.',
        vision: 'Secure DoD contract eligibility through CMMC Level 2 compliance.',
        objectives: [
            'Scope CUI environments and data flows',
            'Implement NIST 800-171 controls',
            'Develop System Security Plan (SSP)',
            'Create Plan of Action & Milestones (POA&M)',
            'Prepare for C3PAO assessment'
        ],
        kpiTargets: [
            { name: 'Control Implementation', target: 100, unit: '%' },
            { name: 'SSP Completion', target: 100, unit: '%' }
        ],
        icon: Building2,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        gradient: 'from-amber-500 to-orange-600'
    }
];

export default function RoadmapTemplatesPage() {
    const params = useParams();
    const clientIdParam = params.id ? parseInt(params.id, 10) : null;
    const { selectedClientId } = useClientContext();
    const clientId = clientIdParam || selectedClientId;
    const [location, setLocation] = useLocation();

    const handleSelectTemplate = (template: any) => {
        // Navigate to create page with template pre-selected
        if (template.id) {
            setLocation(`/clients/${clientId}/roadmap/create?template=${template.id}`);
        } else {
            setLocation(`/clients/${clientId}/roadmap/create`);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
                            onClick={() => setLocation(`/clients/${clientId}/roadmap/dashboard`)}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">Choose a Roadmap Template</h1>
                        <p className="text-muted-foreground mt-2 max-w-2xl">
                            Start with a pre-built strategic framework or build your own from scratch.
                            Each template includes proven objectives, KPIs, and governance structures.
                        </p>
                    </div>
                    <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground bg-slate-100 px-4 py-2 rounded-full">
                        <Target className="w-4 h-4" />
                        <span>{TEMPLATES.length} templates available</span>
                    </div>
                </div>

                {/* Template Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {TEMPLATES.map((template) => (
                        <Card
                            key={template.id}
                            className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                            onClick={() => handleSelectTemplate(template)}
                        >
                            {/* Gradient Top Bar */}
                            <div className={`h-1.5 bg-gradient-to-r ${template.gradient}`} />

                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <div className={`p-3 rounded-xl ${template.bgColor} ${template.color} group-hover:scale-110 transition-transform`}>
                                        <template.icon className="h-6 w-6" />
                                    </div>
                                    <Badge variant="secondary" className="font-mono text-xs">
                                        {template.framework}
                                    </Badge>
                                </div>
                                <CardTitle className="text-xl mt-4 group-hover:text-blue-600 transition-colors">
                                    {template.title}
                                </CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {template.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pt-0">
                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
                                    <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex items-center">
                                        <Zap className="w-3 h-3 mr-1.5" />
                                        Key Objectives
                                    </h4>
                                    <ul className="space-y-2">
                                        {template.objectives.slice(0, 3).map((obj, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                <span className="line-clamp-1">{obj}</span>
                                            </li>
                                        ))}
                                        {template.objectives.length > 3 && (
                                            <li className="text-xs text-slate-400 pl-6">
                                                +{template.objectives.length - 3} more objectives
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </CardContent>

                            <CardFooter className="pt-4">
                                <Button
                                    className={`w-full bg-gradient-to-r ${template.gradient} hover:opacity-90 text-white border-none shadow-md group-hover:shadow-lg transition-all`}
                                >
                                    Use This Template
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}

                    {/* Build from Scratch Card */}
                    <Card
                        className="group flex flex-col border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer justify-center items-center p-8 text-center min-h-[400px]"
                        onClick={() => handleSelectTemplate({})}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center mb-6 transition-colors">
                            <Plus className="h-8 w-8 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <CardTitle className="text-xl mb-3 group-hover:text-blue-600 transition-colors">
                            Build from Scratch
                        </CardTitle>
                        <CardDescription className="max-w-xs">
                            Create a fully custom strategic roadmap with your own vision, objectives, and unique governance structure.
                        </CardDescription>
                        <Button
                            variant="outline"
                            className="mt-6 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all"
                        >
                            Start Custom Roadmap
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Card>
                </div>

                {/* Info Section */}
                <div className="mt-12 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-1">What happens next?</h3>
                            <p className="text-sm text-muted-foreground max-w-2xl">
                                After selecting a template, you'll be guided through a strategic planning wizard where you can
                                customize the vision, objectives, timelines, and governance structure to match your organization's
                                specific needs and context.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
