import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { CheckCircle2, Shield, Search, FileCheck, ClipboardCheck, Scale, History, BookOpen, ScrollText, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { cn } from '@/lib/utils';

export default function AuditReadinessAlignmentPage() {
    const [framework, setFramework] = useState<'iso' | 'soc2'>('iso');

    const isoAreas = [
        {
            id: 'internal-audit',
            title: 'Internal Audit',
            standard: 'ISO 27001 Clause 9.2',
            icon: Search,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            requirements: [
                'Conduct internal audits at planned intervals',
                'Define audit criteria and scope',
                'Select auditors and conduct audits objectively'
            ],
            implementation: [
                { feature: 'Audit Scheduler', detail: 'Calendar-based planning of internal audit cycles' },
                { feature: 'Checklists', detail: 'Pre-built audit protocols for ISO 27001' },
                { feature: 'Finding Tracking', detail: 'Workflow for non-conformities and observations' }
            ]
        },
        {
            id: 'management-review',
            title: 'Management Review',
            standard: 'ISO 27001 Clause 9.3',
            icon: Users,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            requirements: [
                'Top management shall review the organization\'s information security management system',
                'Review status of actions from previous management reviews',
                'Review changes in external and internal issues'
            ],
            implementation: [
                { feature: 'Review Agenda', detail: 'Standardized templates ensuring all required inputs are covered' },
                { feature: 'Meeting Minutes', detail: 'Formal recording of decisions and action items' },
                { feature: 'Action Tracking', detail: 'Follow-up tasks linked to the specific review meeting' }
            ]
        },
        {
            id: 'evidence',
            title: 'Evidence Collection',
            standard: 'ISO 27001 A.5-A.8',
            icon: FileCheck,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            requirements: [
                'Documented information required by the standard',
                'Documented information determined as necessary for effectiveness',
                'Control of records'
            ],
            implementation: [
                { feature: 'Evidence Repository', detail: 'Secure storage linked to specific controls' },
                { feature: 'Automated Collection', detail: 'Integration with cloud providers to snapshot configs' },
                { feature: 'Coverage Mapping', detail: 'Visual heatmaps of control evidence status' }
            ]
        },
        {
            id: 'corrective-action',
            title: 'Corrective Action',
            standard: 'ISO 27001 Clause 10.1',
            icon: ClipboardCheck,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            requirements: [
                'React to the nonconformity and restore service',
                'Evaluate the need for action to eliminate the cause',
                'Implement any action needed and review effectiveness'
            ],
            implementation: [
                { feature: 'CAPA Workflow', detail: 'Structured Root Cause Analysis (5 Whys)' },
                { feature: 'Effectiveness Review', detail: 'Scheduled follow-ups to verify remediation success' },
                { feature: 'Non-conformity Log', detail: 'Centralized register of all identified issues' }
            ]
        }
    ];

    const soc2Areas = [
        {
            id: 'monitoring',
            title: 'Monitoring & Evaluations',
            standard: 'SOC 2 CC4.1 (COSO Principle 16)',
            icon: Search,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            requirements: [
                'Selects, develops, and performs ongoing and/or separate evaluations',
                'Evaluates and ascertains whether the components of internal control are present and functioning',
                'Considers the rate of change in business processes'
            ],
            implementation: [
                { feature: 'Continuous Monitoring', detail: 'Automated checks against cloud infrastructure' },
                { feature: 'Vulnerability Scans', detail: 'Scheduled scanning and reporting integration' },
                { feature: 'Alerting', detail: 'Real-time notifications for control failures' }
            ]
        },
        {
            id: 'oversight',
            title: 'Mgmt Oversight',
            standard: 'SOC 2 CC1.3 (COSO Principle 2)',
            icon: Users,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            requirements: [
                'Board of directors demonstrates independence from management',
                'Management establishes structures, reporting lines, and appropriate authorities',
                'Exercises oversight of the development and performance of internal control'
            ],
            implementation: [
                { feature: 'Strategic Roadmap', detail: 'Board-visible tracking of security initiatives' },
                { feature: 'Policy Approval', detail: 'Formal sign-off workflows for executive leadership' },
                { feature: 'Organization Charts', detail: 'Visual mapping of reporting lines and authorities' }
            ]
        },
        {
            id: 'evidence',
            title: 'Risk Mitigation',
            standard: 'SOC 2 CC3.2 (COSO Principle 11)',
            icon: FileCheck,
            color: 'text-teal-600',
            bgColor: 'bg-teal-50',
            requirements: [
                'Selects and develops control activities that contribute to mitigation',
                'Segregation of duties',
                'Technology general controls'
            ],
            implementation: [
                { feature: 'Control Library', detail: 'Pre-mapped SOC 2 common criteria controls' },
                { feature: 'Evidence Request', detail: 'Workflow for gathering populations and samples' },
                { feature: 'Access Reviews', detail: 'Quarterly user access review campaigns' }
            ]
        },
        {
            id: 'deviations',
            title: 'System Deviations',
            standard: 'SOC 2 CC5.1 (COSO Principle 12)',
            icon: ClipboardCheck,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            requirements: [
                'Identifies and assesses changes that could effectively impact the system',
                'Addresses deviations from established policies',
                'Tracks incidents to resolution'
            ],
            implementation: [
                { feature: 'Incident Management', detail: 'Integrated ticketing for security incidents' },
                { feature: 'Deviation Tracking', detail: 'Exception management for policy violations' },
                { feature: 'SLA Monitoring', detail: 'Tracking response times for identified issues' }
            ]
        }
    ];

    const benefits = [
        { title: 'Reduce Stress', description: 'Continuous readiness eliminates the "audit crunch"', icon: CheckCircle2 },
        { title: 'Lower Costs', description: 'Efficient audits reduce billable auditor hours', icon: Scale },
        { title: 'Confidence', description: 'Data-backed assurance for customer inquiries', icon: Shield },
        { title: 'Traceability', description: 'Full history of compliance activities', icon: History }
    ];

    const currentAreas = framework === 'iso' ? isoAreas : soc2Areas;

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 p-6 lg:p-10">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-600 text-white mb-4">
                            <ScrollText className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                            Audit Readiness
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Ensure continuous compliance and audit preparedness
                        </p>

                        {/* Framework Toggle Tabs */}
                        <div className="flex justify-center">
                            <div className="inline-flex p-1 bg-slate-100 rounded-lg shadow-inner">
                                <button
                                    onClick={() => setFramework('iso')}
                                    className={cn(
                                        "px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200",
                                        framework === 'iso'
                                            ? "bg-white text-teal-600 shadow-sm ring-1 ring-slate-200"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                    )}
                                >
                                    ISO 27001 Aligned
                                </button>
                                <button
                                    onClick={() => setFramework('soc2')}
                                    className={cn(
                                        "px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200",
                                        framework === 'soc2'
                                            ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                    )}
                                >
                                    SOC 2 Type II Ready
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Overview Card */}
                    <Card className="border-2 border-teal-200 bg-white shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                            <CardTitle className="text-2xl">
                                {framework === 'iso' ? 'Continuous Improvement (ISO 27001)' : 'Trust Services Criteria (SOC 2)'}
                            </CardTitle>
                            <CardDescription className="text-base">
                                {framework === 'iso'
                                    ? "Moving from Point-in-Time compliance to Continuous Improvement is the goal of ISO 27001 Clauses 9 & 10. Our platform automates audit cycles and management reviews."
                                    : "SOC 2 requires demonstrating that controls are operating effectively over a period of time. Our platform provides the continuous monitoring and evidence required for a Type II report."
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-teal-50 rounded-lg">
                                    <div className="text-3xl font-bold text-teal-600">4</div>
                                    <div className="text-sm text-muted-foreground">Key Processes</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-3xl font-bold text-green-600">Full</div>
                                    <div className="text-sm text-muted-foreground">Audit Trail</div>
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-3xl font-bold text-blue-600">Auto</div>
                                    <div className="text-sm text-muted-foreground">Evidence Linking</div>
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
                                                <Shield className="w-5 h-5 text-teal-600" />
                                                Platform Implementation
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {area.implementation.map((impl, idx) => (
                                                    <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-teal-300 transition-colors">
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
                    <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Shield className="w-6 h-6 text-teal-600" />
                                Strategic Value
                            </CardTitle>
                            <CardDescription>
                                Turn audits from a burden into a competitive advantage
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {benefits.map((benefit, idx) => (
                                    <div key={idx} className="p-4 bg-white rounded-lg shadow-sm border border-teal-100 hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-teal-100 rounded-lg">
                                                <benefit.icon className="w-5 h-5 text-teal-600" />
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
        </DashboardLayout>
    );
}
