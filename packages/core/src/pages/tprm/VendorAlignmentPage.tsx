import React, { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { CheckCircle2, Shield, Users, Search, FileText, BarChart3, TrendingUp, BookOpen, Building } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { cn } from '@/lib/utils';

export default function VendorAlignmentPage() {
    const [framework, setFramework] = useState<'iso' | 'nist'>('iso');

    const isoAreas = [
        {
            id: 'security',
            title: 'Supplier Relationships',
            standard: 'ISO 27001 Clause 5.19',
            icon: Shield,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            requirements: [
                'Define and document supplier security requirements',
                'Agree on potential access to information assets',
                'Address risks associated with supplier access'
            ],
            implementation: [
                { feature: 'Vendor Database', detail: 'Centralized registry of all suppliers and their risk profiles' },
                { feature: 'Risk Tiering', detail: 'Classification of vendors based on data access and criticality' },
                { feature: 'Security Exhibits', detail: 'Tracking of contractual security addendums' }
            ]
        },
        {
            id: 'supply-chain',
            title: 'Supply Chain Security',
            standard: 'ISO 27001 Clause 5.21',
            icon: Building,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            requirements: [
                'Manage information security risks in the ICT supply chain',
                'Implement processes for supply chain compromise',
                'Verify origin and integrity'
            ],
            implementation: [
                { feature: 'Tier N-th Mapping', detail: 'Mapping of critical 4th party dependencies' },
                { feature: 'Incident Reporting', detail: 'Workflows for vendor security incident notification' },
                { feature: 'Access Controls', detail: 'Granular tracking of vendor system access' }
            ]
        },
        {
            id: 'monitoring',
            title: 'Monitoring & Review',
            standard: 'ISO 27001 Clause 5.22',
            icon: Search,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            requirements: [
                'Regularly monitor, review and audit supplier service delivery',
                'Adhere to security requirements',
                'Manage changes to provision of services'
            ],
            implementation: [
                { feature: 'Security Reviews', detail: 'Annual/periodic security assessment workflows' },
                { feature: 'Performance Tracking', detail: 'Monitoring of SLA adherence and security incidents' },
                { feature: 'Contract Review', detail: 'Reminders for contract renewals and security clause updates' }
            ]
        },
        {
            id: 'cloud',
            title: 'Cloud Services',
            standard: 'ISO 27001 Clause 5.23',
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            requirements: [
                'Specify acquisition requirements for cloud services',
                'Define information security roles and responsibilities',
                'Manage cloud service changes'
            ],
            implementation: [
                { feature: 'Cloud Inventory', detail: 'Specific tracking for SaaS/PaaS/IaaS providers' },
                { feature: 'Shared Responsibility', detail: 'Documentation of responsibility matrix (RACI)' },
                { feature: 'Certifications', detail: 'Tracking of SOC 2, ISO 27001 certificates' }
            ]
        }
    ];

    const nistAreas = [
        {
            id: 'plan',
            title: 'Plan (SCRM)',
            standard: 'NIST 800-161 (Frame)',
            icon: Shield,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            requirements: [
                'ID.SC-1: Cyber supply chain risk management processes are identified',
                'ID.SC-2: Integrated into SCRM',
                'Determine risk appetite regarding suppliers'
            ],
            implementation: [
                { feature: 'SCRM Policy', detail: 'Template library for Supply Chain policies' },
                { feature: 'Strategy Doc', detail: 'Formalized vendor acceptance criteria' },
                { feature: 'Asset Integration', detail: 'Linking vendors to critical assets' }
            ]
        },
        {
            id: 'assess',
            title: 'Assess',
            standard: 'NIST 800-161 (Assess)',
            icon: Search,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            requirements: [
                'ID.SC-3: Suppliers are assessed prior to entering into contracts',
                'RA-3: Risk Assessment',
                'Due diligence is performed'
            ],
            implementation: [
                { feature: 'Questionnaires', detail: 'SIG Lite / Full questionnaire support' },
                { feature: 'Scoring Engine', detail: 'Automated risk calculation based on responses' },
                { feature: 'Financial Health', detail: 'Integration fields for credit/stability check' }
            ]
        },
        {
            id: 'respond',
            title: 'Respond',
            standard: 'NIST 800-161 (Respond)',
            icon: TrendingUp,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            requirements: [
                'ID.SC-4: Monitoring for changes in supplier risk',
                'IR-4: Incident Handling',
                'Response plans executed'
            ],
            implementation: [
                { feature: 'Incident Tracker', detail: 'Vendor-specific incident logs' },
                { feature: 'Corrective Actions', detail: 'Assigning remediations to vendors' },
                { feature: 'Contingency Plans', detail: 'Exit strategies for critical vendors' }
            ]
        },
        {
            id: 'monitor',
            title: 'Monitor',
            standard: 'NIST 800-161 (Monitor)',
            icon: BarChart3,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            requirements: [
                'ID.SC-5: Response and recovery planning and testing',
                'Continuous monitoring of supplier performance',
                'Review of audit logs'
            ],
            implementation: [
                { feature: 'Continuous Monitoring', detail: 'Scheduled re-assessments' },
                { feature: 'Performance Metrics', detail: 'KPI tracking for vendor turnaround times' },
                { feature: 'Alerts', detail: 'Notifications on contract or certificate expiry' }
            ]
        }
    ];

    const benefits = [
        { title: 'Reduce Liability', description: 'Clear documentation of due diligence reducing legal exposure', icon: FileText },
        { title: 'Supply Chain Resilience', description: 'Identify and mitigate risks from upstream providers', icon: Shield },
        { title: 'Audit Efficiency', description: 'Centralized repository for all vendor evidence', icon: Search },
        { title: 'Cost Control', description: 'Better visibility into vendor landscape and redundancies', icon: BarChart3 }
    ];

    const currentAreas = framework === 'iso' ? isoAreas : nistAreas;

    return (

            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6 lg:p-10">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 text-white mb-4">
                            <Users className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Third-Party Risk Management
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Comprehensive alignment with ISO 27001 and NIST SCRM Guidelines
                        </p>

                        {/* Framework Toggle Tabs */}
                        <div className="flex justify-center">
                            <div className="inline-flex p-1 bg-slate-100 rounded-lg shadow-inner">
                                <button
                                    onClick={() => setFramework('iso')}
                                    className={cn(
                                        "px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200",
                                        framework === 'iso'
                                            ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                    )}
                                >
                                    ISO 27001 Aligned
                                </button>
                                <button
                                    onClick={() => setFramework('nist')}
                                    className={cn(
                                        "px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200",
                                        framework === 'nist'
                                            ? "bg-white text-purple-600 shadow-sm ring-1 ring-slate-200"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                    )}
                                >
                                    NIST SP 800-161 Ready
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Overview Card */}
                    <Card className="border-2 border-indigo-200 bg-white shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                            <CardTitle className="text-2xl">
                                {framework === 'iso' ? 'Supplier Relationship Security' : 'Supply Chain Risk Management (SCRM)'}
                            </CardTitle>
                            <CardDescription className="text-base">
                                {framework === 'iso'
                                    ? "Managing the risks associated with third-party vendors is critical. Our platform provides a structured approach to evaluate, onboard, monitor, and offboard suppliers in alignment with ISO 27001."
                                    : "NIST SP 800-161 provides guidance on identifying, assessing, responding to, and monitoring supply chain risks. Our platform operationalizes these concepts into a seamless workflow."
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                                    <div className="text-3xl font-bold text-indigo-600">5</div>
                                    <div className="text-sm text-muted-foreground">Lifecycle Stages</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-3xl font-bold text-green-600">Full</div>
                                    <div className="text-sm text-muted-foreground">Audit Trail</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <div className="text-3xl font-bold text-purple-600">Auto</div>
                                    <div className="text-sm text-muted-foreground">Due Diligence</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Compliance Areas */}
                    <Tabs defaultValue={currentAreas[0].id} className="space-y-6" key={framework}>
                        <TabsList className="grid grid-cols-2 lg:grid-cols-4 gap-2 h-auto bg-transparent p-0">
                            {currentAreas.map((area) => (
                                <TabsTrigger
                                    key={area.id}
                                    value={area.id}
                                    className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-600 flex flex-col items-center gap-1 p-3 border border-transparent data-[state=active]:border-slate-200 hover:bg-white/50 transition-all rounded-lg"
                                >
                                    <area.icon className={cn("w-5 h-5", area.color)} />
                                    <span className="text-xs font-bold">{area.title}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {currentAreas.map((area) => (
                            <TabsContent key={area.id} value={area.id} className="space-y-6 mt-4">
                                <Card className="border-2 shadow-lg">
                                    <CardHeader className={`${area.bgColor} border-b`}>
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                                                        <area.icon className={`w-6 h-6 ${area.color}`} />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-2xl">{area.title}</CardTitle>
                                                        <CardDescription className="text-sm font-medium">{area.standard}</CardDescription>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant="default" className="bg-green-600">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Supported
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-6">
                                        {/* Requirements */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                                <BookOpen className="w-5 h-5 text-slate-600" />
                                                Standard Requirements
                                            </h3>
                                            <ul className="space-y-2">
                                                {area.requirements.map((req, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                        <span>{req}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Implementation */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                                <Shield className="w-5 h-5 text-indigo-600" />
                                                Platform Implementation
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {area.implementation.map((impl, idx) => (
                                                    <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h4 className="font-semibold text-sm">{impl.feature}</h4>
                                                            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                                                                ✓ Supported
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">{impl.detail}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        ))}
                    </Tabs>

                    {/* Benefits Section */}
                    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-indigo-600" />
                                Strategic Value
                            </CardTitle>
                            <CardDescription>
                                Secure your supply chain and reduce third-party risk exposure
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {benefits.map((benefit, idx) => (
                                    <div key={idx} className="p-4 bg-white rounded-lg shadow-sm border border-indigo-100 hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-indigo-100 rounded-lg">
                                                <benefit.icon className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm mb-1">{benefit.title}</h4>
                                                <p className="text-xs text-muted-foreground">{benefit.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

    );
}
