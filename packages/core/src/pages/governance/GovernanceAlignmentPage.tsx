import React, { useState } from 'react';
import { PageGuide } from '@/components/PageGuide';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { CheckCircle2, Shield, Users, Target, FileText, Scale, TrendingUp, BookOpen, UserCog } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { cn } from '@/lib/utils';

export default function GovernanceAlignmentPage() {
    const [framework, setFramework] = useState<'iso' | 'nist'>('iso');

    const isoAreas = [
        {
            id: 'leadership',
            title: 'Leadership & Commitment',
            standard: 'ISO 27001 Clause 5.1',
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            requirements: [
                'Ensure the information security policy and objectives are established',
                'Ensure integration of requirements into organization processes',
                'Ensure resources are available'
            ],
            implementation: [
                { feature: 'OKRs & Objectives', detail: 'Tracking of strategic security objectives linked to programs' },
                { feature: 'Management Review', detail: 'Formalized workflows for annual management reviews' },
                { feature: 'Resource Allocation', detail: 'Budget and headcount tracking within program settings' }
            ]
        },
        {
            id: 'roles',
            title: 'Roles & Responsibilities',
            standard: 'ISO 27001 Clause 5.3',
            icon: UserCog,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            requirements: [
                'Ensure responsibilities and authorities are assigned and communicated',
                'Ensure conformance to the requirements',
                'Report on performance'
            ],
            implementation: [
                { feature: 'People Registry', detail: 'Central database of employees, contractors, and stakeholders' },
                { feature: 'RACI Matrix', detail: 'Detailed responsibility assignment (Responsible, Accountable, Consulted, Informed)' },
                { feature: 'Owner Assignment', detail: 'Granular ownership of policies, risks, and controls' }
            ]
        },
        {
            id: 'policies',
            title: 'Policy Management',
            standard: 'ISO 27001 Clause 5.2',
            icon: FileText,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            requirements: [
                'Establish an information security policy',
                'Ensure it is available as documented information',
                'Communicate to all relevant parties'
            ],
            implementation: [
                { feature: 'Policy Lifecycle', detail: 'Draft, Review, Approve, Publish, Archive workflows' },
                { feature: 'Version Control', detail: 'Immutable history of policy revisions' },
                { feature: 'Attestation', detail: 'Employee acknowledgement tracking' },
                { feature: 'Policy Portal', detail: 'Centralized view for all staff' }
            ]
        },
        {
            id: 'performance',
            title: 'Performance Evaluation',
            standard: 'ISO 27001 Clause 9',
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            requirements: [
                'Monitor, measure, analyze and evaluate',
                'Internal audit',
                'Management review'
            ],
            implementation: [
                { feature: 'Governance Score', detail: 'Real-time calculation of overall program health' },
                { feature: 'Audit Management', detail: 'Internal audit scheduling and finding tracking' },
                { feature: 'Metrics Dashboard', detail: 'KPI and KRI visualization' }
            ]
        }
    ];

    const nistAreas = [
        {
            id: 'context',
            title: 'Organizational Context',
            standard: 'NIST CSF GV.OC',
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            requirements: [
                'Organizational mission, objectives, and activities are understood and prioritized',
                'Internal and external stakeholders are identified',
                'Outcomes are used to inform roles and responsibilities'
            ],
            implementation: [
                { feature: 'Context Registry', detail: 'Document internal/external issues and stakeholders' },
                { feature: 'Mission Alignment', detail: 'Link security objectives to business goals' },
                { feature: 'Asset Prioritization', detail: 'Criticality scoring for all assets based on business impact' }
            ]
        },
        {
            id: 'roles',
            title: 'Roles & Authorities',
            standard: 'NIST CSF GV.RR',
            icon: UserCog,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            requirements: [
                'Roles and responsibilities are established and communicated',
                'Resources are allocated',
                'Coordination is established'
            ],
            implementation: [
                { feature: 'People & Roles', detail: 'Role-based access control and responsibility mapping' },
                { feature: 'RACI Matrix', detail: 'Clear definition of who is Responsible and Accountable' },
                { feature: 'Resource Tracking', detail: 'Budget and FTE allocation per program' }
            ]
        },
        {
            id: 'policy',
            title: 'Policy Management',
            standard: 'NIST CSF GV.PO',
            icon: FileText,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            requirements: [
                'Organizational information security policy is established',
                'Policy is communicated and enforced',
                'Policy is reviewing and updated'
            ],
            implementation: [
                { feature: 'Policy Engine', detail: 'Full lifecycle management of policies from draft to retirement' },
                { feature: 'Enforcement Metrics', detail: 'Automated evidence collection for policy adherence' },
                { feature: 'Annual Review', detail: 'Scheduled workflows for policy updates' }
            ]
        },
        {
            id: 'oversight',
            title: 'Oversight',
            standard: 'NIST CSF GV.OV',
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            requirements: [
                'Outcomes are reviewed',
                'Performance is measured',
                'Adjustments are made'
            ],
            implementation: [
                { feature: 'Executive Dashboard', detail: 'High-level view of program performance against targets' },
                { feature: 'Gap Analysis', detail: 'Continuous comparison of current state vs target profile' },
                { feature: 'Corrective Actions', detail: 'Workflow for addressing underperforming areas' }
            ]
        }
    ];

    const benefits = [
        { title: 'Accountability', description: 'Clear lines of ownership reduce ambiguity', icon: UserCog },
        { title: 'Standardization', description: 'Consistent policy framework across the organization', icon: Scale },
        { title: 'Transparency', description: 'Visibility into program performance for leadership', icon: TrendingUp },
        { title: 'Culture', description: 'Embeds security into organizational DNA', icon: Shield }
    ];

    const currentAreas = framework === 'iso' ? isoAreas : nistAreas;

    return (
        <DashboardLayout>
            <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 lg:p-10">
                <div className="absolute top-6 right-6">
                    <PageGuide
                        title="Governance Alignment"
                        description="Align your security program with global standards like ISO 27001 and NIST CSF."
                        rationale="Ensures comprehensive coverage of governance requirements and demonstrates due diligence."
                        howToUse={[
                            { step: "Select Framework", description: "Toggle between ISO 27001 and NIST CSF to see relevant requirements." },
                            { step: "Review Areas", description: "Explore specific governance domains like Leadership and Policy." },
                            { step: "Track Implementation", description: "See which platform features map to specific standard requirements." }
                        ]}
                        integrations={[
                            { name: "People Registry", description: "Manage stakeholders." },
                            { name: "Policies", description: "Draft and approve policies." },
                            { name: "Risk Register", description: "Assess risks." }
                        ]}
                    />
                </div>
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mb-4">
                            <Scale className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            Governance & Oversight
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Comprehensive alignment with global governance standards
                        </p>

                        {/* Framework Toggle Tabs */}
                        <div className="flex justify-center">
                            <div className="inline-flex p-1 bg-slate-100 rounded-lg shadow-inner">
                                <button
                                    onClick={() => setFramework('iso')}
                                    className={cn(
                                        "px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200",
                                        framework === 'iso'
                                            ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
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
                                            ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                    )}
                                >
                                    NIST CSF 2.0 Ready
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Overview Card */}
                    <Card className="border-2 border-blue-200 bg-white shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                            <CardTitle className="text-2xl">
                                {framework === 'iso' ? 'Establishing Effective Governance (ISO)' : 'Governing with NIST CSF'}
                            </CardTitle>
                            <CardDescription className="text-base">
                                {framework === 'iso'
                                    ? "Effective information security governance in ISO 27001 ensures that security strategies align with business objectives through leadership, policy, and roles."
                                    : "The GOVERN function in NIST CSF 2.0 provides outcomes to inform what an organization needs to do to achieve and prioritize its cybersecurity strategy."
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-3xl font-bold text-blue-600">4</div>
                                    <div className="text-sm text-muted-foreground">Key Pillars</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-3xl font-bold text-green-600">Full</div>
                                    <div className="text-sm text-muted-foreground">Framework Support</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <div className="text-3xl font-bold text-purple-600">Auto</div>
                                    <div className="text-sm text-muted-foreground">Score Calculation</div>
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
                                                <Shield className="w-5 h-5 text-blue-600" />
                                                Platform Implementation
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {area.implementation.map((impl, idx) => (
                                                    <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
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
                    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Target className="w-6 h-6 text-blue-600" />
                                Strategic Value
                            </CardTitle>
                            <CardDescription>
                                Align security with business goals through structured governance
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {benefits.map((benefit, idx) => (
                                    <div key={idx} className="p-4 bg-white rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <benefit.icon className="w-5 h-5 text-blue-600" />
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
