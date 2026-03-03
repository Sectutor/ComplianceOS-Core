import React from 'react';
import { useParams, Link } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { Button } from '@complianceos/ui/ui/button';
import { CheckCircle2, Lock, FileText, ClipboardList, Zap, TrendingUp, ArrowRight, BookOpen, ArrowLeft, Info } from 'lucide-react';

export default function FederalProgramGuide() {
    const params = useParams();
    const clientId = parseInt(params.id || "0");

    const steps = [
        {
            id: 'categorize',
            step: 1,
            title: 'FIPS 199 Categorization',
            subtitle: 'Impact Levels',
            description: 'Before securing a system, you must understand its criticality. Categorize your information systems based on the potential impact (Confidentiality, Integrity, Availability) of a security breach.',
            icon: Lock,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            accent: 'from-blue-600 to-cyan-600',
            bestPractices: [
                'Determine the "high water mark" for the system based on the most critical information type.',
                'Categorization drives the selection of baseline security controls.',
                'Ensure mission owners approve the final categorization.'
            ],
            link: `/clients/${clientId}/federal/fips-199`,
            cta: 'Categorize System'
        },
        {
            id: 'ssp',
            step: 2,
            title: 'System Security Plan (SSP)',
            subtitle: 'Document Controls',
            description: 'The SSP is the foundational document of your authorization package. It describes the system boundary, environment of operation, and how each security requirement is implemented.',
            icon: FileText,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            accent: 'from-indigo-600 to-purple-600',
            bestPractices: [
                'Clearly define and diagram the authorization boundary.',
                'Provide detailed, specific implementation statements for each control.',
                'Update the SSP continuously as the system evolves.'
            ],
            link: `/clients/${clientId}/federal/ssp-171`,
            cta: 'Develop SSP'
        },
        {
            id: 'assess',
            step: 3,
            title: 'Security Assessment (SAR)',
            subtitle: 'Verify Implementation',
            description: 'A formal assessment evaluates whether the controls described in the SSP are implemented correctly, operating as intended, and producing the desired outcomes.',
            icon: ClipboardList,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            accent: 'from-amber-500 to-orange-500',
            bestPractices: [
                'Use an independent assessment team (or C3PAO for CMMC).',
                'Develop a detailed Security Assessment Plan (SAP) before testing begins.',
                'Document all findings clearly in the Security Assessment Report (SAR).'
            ],
            link: `/clients/${clientId}/federal/sar-171`,
            cta: 'Review SAR'
        },
        {
            id: 'remediate',
            step: 4,
            title: 'Remediation (POA&M)',
            subtitle: 'Fix Weaknesses',
            description: 'The Plan of Action and Milestones (POA&M) tracks the remediation of weaknesses identified during the assessment. It represents the organization\'s commitment to correcting deficiencies.',
            icon: Zap,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            accent: 'from-red-500 to-rose-600',
            bestPractices: [
                'Assign a distinct owner and realistic targeted completion date to every POA&M item.',
                'Prioritize remediation based on risk severity.',
                'Update the POA&M regularly and provide status reports to the AO.'
            ],
            link: `/clients/${clientId}/federal/poam`,
            cta: 'Manage POA&M'
        },
        {
            id: 'monitor',
            step: 5,
            title: 'Continuous Monitoring',
            subtitle: 'Maintain Authorization',
            description: 'Security is not a point in time. Continuous monitoring ensures the security posture remains acceptable despite changes to the system or threat environment.',
            icon: TrendingUp,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            accent: 'from-emerald-500 to-teal-500',
            bestPractices: [
                'Define a Continuous Monitoring strategy and schedule out automated checks.',
                'Integrate vulnerability scanning and SIEM logs into your compliance tracking.',
                'Report metrics to the Authorizing Official (AO) on a defined frequency.'
            ],
            link: `/clients/${clientId}/federal/rmf`,
            cta: 'Continuous Monitoring'
        }
    ];

    return (
        <DashboardLayout>
            <div className="relative min-h-screen bg-slate-50 p-6 lg:p-10">
                <div className="max-w-4xl mx-auto space-y-8">
                    <Link href={`/clients/${clientId}/federal/dashboard`}>
                        <Button variant="ghost" className="mb-4 text-slate-500 hover:text-slate-900">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Federal Hub
                        </Button>
                    </Link>
                    
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-700 mb-4 shadow-sm border border-blue-200">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                            Federal Compliance Guide
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                            A step-by-step roadmap to navigate DoD and Federal compliance requirements (NIST 800-171, CMMC, FedRAMP).
                        </p>
                    </div>

                    <div className="my-10 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8 flex items-start gap-4">
                        <div className="mt-1">
                            <Info className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-slate-900 mb-2">The RMF Journey</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Understanding the federal Risk Management Framework (RMF) or CMMC process can be daunting. This guided workflow breaks down the journey into achievable phases, ensuring you complete prerequisites (like Categorization) before moving to advanced implementation statements (SSP) or audits (SAR).
                            </p>
                        </div>
                    </div>

                    <div className="space-y-12 relative pb-12">
                        <div className="absolute top-12 bottom-12 left-[31px] w-0.5 bg-slate-200 z-0 hidden sm:block"></div>

                        {steps.map((step) => (
                            <div key={step.id} className="relative z-10 flex flex-col sm:flex-row gap-6 lg:gap-8 group">
                                <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-md border-2 border-white ring-1 ring-slate-100 group-hover:ring-blue-200 transition-all duration-300">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${step.accent} text-white shadow-inner`}>
                                        <span className="font-black text-xl">{step.step}</span>
                                    </div>
                                </div>

                                <Card className="flex-grow border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader className={`${step.bgColor} border-b border-white rounded-t-xl bg-opacity-50`}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <Badge variant="outline" className={`mb-2 bg-white ${step.color} border-current`}>
                                                    Phase {step.step}: {step.subtitle}
                                                </Badge>
                                                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                                                    <step.icon className={`w-6 h-6 ${step.color}`} />
                                                    {step.title}
                                                </CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-6">
                                        <p className="text-slate-700 leading-relaxed text-lg">
                                            {step.description}
                                        </p>

                                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                                            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                Best Practices
                                            </h4>
                                            <ul className="space-y-3">
                                                {step.bestPractices.map((practice, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-slate-600">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0"></div>
                                                        <span className="leading-relaxed">{practice}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        
                                        <div className="pt-2">
                                            <Link href={step.link}>
                                                <Button className={`bg-gradient-to-r ${step.accent} hover:opacity-90 text-white font-medium shadow-md transition-all group-hover:translate-x-1`}>
                                                    {step.cta} <ArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center pb-20">
                        <Link href={`/clients/${clientId}/federal/dashboard`}>
                            <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-14 rounded-full shadow-lg hover:shadow-xl transition-all">
                                Return to Dashboard
                            </Button>
                        </Link>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}
