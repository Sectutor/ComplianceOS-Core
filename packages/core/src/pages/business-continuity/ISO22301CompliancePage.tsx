import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { CheckCircle2, Shield, FileText, Users, Activity, BookOpen, AlertTriangle, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { trpc } from '@/lib/trpc';
import { useParams } from 'wouter';

export default function ISO22301CompliancePage() {
    const params = useParams();
    const clientId = parseInt(params.clientId || "0");
    const { data: metrics } = trpc.businessContinuity.getDashboardMetrics.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const complianceAreas = [
        {
            id: 'bia',
            title: 'Business Impact Analysis',
            clause: 'Clause 8.2.2',
            icon: Activity,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            requirements: [
                'Conduct BIAs to understand impact of disruptions',
                'Identify critical activities and recovery priorities',
                'Establish Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)'
            ],
            implementation: [
                { feature: 'Normalized recovery_objectives table', status: 'complete', detail: 'Stores RTO, RPO, MTPD for each critical activity' },
                { feature: 'Impact assessments', status: 'complete', detail: 'Financial, operational, reputational, legal impacts tracked' },
                { feature: 'Criticality tiers', status: 'complete', detail: 'Processes categorized by importance' },
                { feature: 'Dependencies tracking', status: 'complete', detail: 'Upstream/downstream dependencies documented' }
            ]
        },
        {
            id: 'strategy',
            title: 'BC Strategy Development',
            clause: 'Clause 8.3',
            icon: Shield,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            requirements: [
                'Develop strategies to maintain/recover critical activities',
                'Link strategies to specific scenarios and BIAs'
            ],
            implementation: [
                { feature: 'bc_strategies table', status: 'complete', detail: 'Dedicated strategy repository' },
                { feature: 'bc_plan_strategies join table', status: 'complete', detail: 'Links strategies to specific plans' },
                { feature: 'bc_plan_scenarios join table', status: 'complete', detail: 'Links plans to disruptive scenarios' },
                { feature: 'bc_plan_bias join table', status: 'complete', detail: 'Links plans to BIAs they address' }
            ]
        },
        {
            id: 'plans',
            title: 'BC Plans & Procedures',
            clause: 'Clause 8.4',
            icon: FileText,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            requirements: [
                'Document procedures for responding to disruptions',
                'Include activation criteria, roles, communication protocols',
                'Maintain version control and change management'
            ],
            implementation: [
                { feature: 'bc_plans table', status: 'complete', detail: 'Structured plan storage with versioning' },
                { feature: 'plan_versions table', status: 'complete', detail: 'Complete version history with snapshots' },
                { feature: 'plan_change_log table', status: 'complete', detail: 'Audit trail of all changes (who, what, when)' },
                { feature: 'bc_plan_contacts table', status: 'complete', detail: 'Call tree/stakeholder management' },
                { feature: 'bc_plan_communication_channels', status: 'complete', detail: 'Communication protocols' },
                { feature: 'bc_plan_logistics table', status: 'complete', detail: 'Alternate sites, resources' }
            ]
        },
        {
            id: 'testing',
            title: 'Exercising & Testing',
            clause: 'Clause 8.5',
            icon: TrendingUp,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            requirements: [
                'Regularly test BC plans through exercises',
                'Document exercise results and lessons learned',
                'Track testing frequency'
            ],
            implementation: [
                { feature: 'plan_exercises table', status: 'complete', detail: 'Records all exercises (tabletop, simulation, full)' },
                { feature: 'Exercise tracking', status: 'complete', detail: 'Type, date, conductor, outcome, follow-up tasks' },
                { feature: 'Last tested date', status: 'complete', detail: 'Tracked in bc_plans.lastTestedDate' },
                { feature: 'Next test date', status: 'complete', detail: 'Scheduled testing tracked' }
            ]
        },
        {
            id: 'governance',
            title: 'Governance & Oversight',
            clause: 'Clause 5.3',
            icon: Users,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            requirements: [
                'Define roles and responsibilities',
                'Management commitment and oversight',
                'Resource allocation'
            ],
            implementation: [
                { feature: 'bc_programs table', status: 'complete', detail: 'Program-level governance structure' },
                { feature: 'bc_committee_members table', status: 'complete', detail: 'Steering committee roles' },
                { feature: 'Contact roles', status: 'complete', detail: 'Plan coordinators, approvers, stakeholders' },
                { feature: 'bc_approvals table', status: 'complete', detail: 'Formal approval workflows' }
            ]
        },
        {
            id: 'documentation',
            title: 'Documentation & Records',
            clause: 'Clause 7.5',
            icon: BookOpen,
            color: 'text-cyan-600',
            bgColor: 'bg-cyan-50',
            requirements: [
                'Maintain documented information',
                'Control of documents (version, approval, distribution)',
                'Retention of records'
            ],
            implementation: [
                { feature: 'Version control', status: 'complete', detail: 'Full snapshot history in plan_versions' },
                { feature: 'Change log', status: 'complete', detail: 'Complete audit trail in plan_change_log' },
                { feature: 'Appendices', status: 'complete', detail: 'Supporting documents in bc_plan_appendices' },
                { feature: 'Sections', status: 'complete', detail: 'Structured content in bc_plan_sections' }
            ]
        },
        {
            id: 'training',
            title: 'Training & Awareness',
            clause: 'Clause 7.2 & 7.3',
            icon: Users,
            color: 'text-pink-600',
            bgColor: 'bg-pink-50',
            requirements: [
                'Ensure personnel are competent',
                'Track training completion'
            ],
            implementation: [
                { feature: 'bc_training_records table', status: 'complete', detail: 'Training completion tracking' },
                { feature: 'Expiry dates', status: 'complete', detail: 'Recertification requirements' },
                { feature: 'Training types', status: 'complete', detail: 'Awareness, plan-specific, role-based' }
            ]
        },
        {
            id: 'monitoring',
            title: 'Monitoring & Review',
            clause: 'Clause 9.1',
            icon: Activity,
            color: 'text-teal-600',
            bgColor: 'bg-teal-50',
            requirements: [
                'Monitor BC arrangements',
                'Review effectiveness',
                'Track metrics and KPIs'
            ],
            implementation: [
                { feature: 'Dashboard metrics', status: 'complete', detail: 'Readiness scores, plan coverage' },
                { feature: 'Exercise tracking', status: 'complete', detail: 'Testing frequency and outcomes' },
                { feature: 'Change log', status: 'complete', detail: 'Activity monitoring' },
                { feature: 'Status tracking', status: 'complete', detail: 'Plan approval status' }
            ]
        }
    ];

    const benefits = [
        { title: 'Audit-Ready', description: 'All required documentation and records maintained', icon: CheckCircle2 },
        { title: 'Traceability', description: 'Complete lineage from risk → BIA → strategy → plan', icon: TrendingUp },
        { title: 'Governance', description: 'Clear roles, approvals, and oversight', icon: Users },
        { title: 'Testing Evidence', description: 'Documented exercise history', icon: Activity },
        { title: 'Version Control', description: 'Meets document control requirements', icon: FileText },
        { title: 'Change Management', description: 'Full audit trail of modifications', icon: BookOpen }
    ];

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 lg:p-10">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mb-4">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            ISO 22301 Compliance
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Business Continuity Management System (BCMS) - International Standard Alignment
                        </p>
                        <div className="flex items-center justify-center gap-2">
                            <Badge variant="default" className="text-sm px-4 py-1">
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Fully Aligned
                            </Badge>
                            <Badge variant="outline" className="text-sm px-4 py-1">
                                8 Core Areas Supported
                            </Badge>
                        </div>
                    </div>

                    {/* Overview Card */}
                    <Card className="border-2 border-blue-200 bg-white shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                            <CardTitle className="text-2xl">What is ISO 22301?</CardTitle>
                            <CardDescription className="text-base">
                                ISO 22301 is the international standard for Business Continuity Management Systems (BCMS).
                                It provides a framework for planning, establishing, implementing, operating, monitoring,
                                reviewing, maintaining and continually improving a documented management system to protect
                                against, reduce the likelihood of, and ensure recovery from disruptive incidents.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-3xl font-bold text-blue-600">{metrics?.readinessScore || 0}%</div>
                                    <div className="text-sm text-muted-foreground">Readiness Score</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-3xl font-bold text-green-600">{metrics?.approvedPlans || 0}/{metrics?.totalPlans || 0}</div>
                                    <div className="text-sm text-muted-foreground">Plans Approved</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <div className="text-3xl font-bold text-purple-600">{metrics?.completedExercises || 0}</div>
                                    <div className="text-sm text-muted-foreground">Tests Completed</div>
                                </div>
                                <div className="text-center p-4 bg-orange-50 rounded-lg">
                                    <div className="text-3xl font-bold text-orange-600">{metrics?.completedBIAs || 0}</div>
                                    <div className="text-sm text-muted-foreground">BIAs Finished</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Compliance Areas */}
                    <Tabs defaultValue="bia" className="space-y-6">
                        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 h-auto bg-transparent">
                            {complianceAreas.map((area) => (
                                <TabsTrigger
                                    key={area.id}
                                    value={area.id}
                                    className="data-[state=active]:bg-white data-[state=active]:shadow-md flex flex-col items-center gap-1 p-3"
                                >
                                    <area.icon className={`w-5 h-5 ${area.color}`} />
                                    <span className="text-xs font-medium">{area.title.split(' ')[0]}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {complianceAreas.map((area) => (
                            <TabsContent key={area.id} value={area.id} className="space-y-6">
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
                                                        <CardDescription className="text-sm font-medium">{area.clause}</CardDescription>
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
                                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                                                ISO 22301 Requirements
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
                                                Our Implementation
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {area.implementation.map((impl, idx) => (
                                                    <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h4 className="font-semibold text-sm">{impl.feature}</h4>
                                                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
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
                    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                                Compliance Benefits
                            </CardTitle>
                            <CardDescription>
                                Key advantages of our ISO 22301-aligned implementation
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {benefits.map((benefit, idx) => (
                                    <div key={idx} className="p-4 bg-white rounded-lg shadow-sm border border-green-100 hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <benefit.icon className="w-5 h-5 text-green-600" />
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

                    {/* Footer Note */}
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-6">
                            <p className="text-sm text-center text-muted-foreground">
                                <strong>Note:</strong> This structure makes it much easier to demonstrate compliance during ISO 22301
                                certification audits, as all the required evidence is properly structured and easily retrievable.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
