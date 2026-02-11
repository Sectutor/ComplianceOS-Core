import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { CheckCircle2, Shield, AlertTriangle, Activity, Search, Scale, FileText, BarChart3, TrendingUp, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { cn } from '@/lib/utils';
import { PageGuide } from '@/components/PageGuide';

export default function RiskAlignmentPage() {
    const [framework, setFramework] = useState<'iso' | 'nist'>('iso');

    const isoAreas = [
        {
            id: 'identification',
            title: 'Risk Identification',
            standard: 'ISO 27005 Clause 8.2',
            icon: Search,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            requirements: [
                'Identify assets essential to information security',
                'Identify threats and vulnerabilities associated with assets',
                'Identify existing controls and their effectiveness'
            ],
            implementation: [
                { feature: 'Asset Register', status: 'complete', detail: 'Centralized inventory of information assets with criticality ratings' },
                { feature: 'Threat Library', status: 'complete', detail: 'Pre-populated database of common threats (ransomware, theft, etc.)' },
                { feature: 'Vulnerability Scanning', status: 'complete', detail: 'Integration with scanners and manual vulnerability logging' }
            ]
        },
        {
            id: 'assessment',
            title: 'Risk Assessment',
            standard: 'ISO 27005 Clause 8.3',
            icon: Activity,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            requirements: [
                'Assess consequences (impact) and likelihood of risk scenarios',
                'Determine the level of risk',
                'Compare risk levels against risk acceptance criteria'
            ],
            implementation: [
                { feature: 'Risk Matrix', status: 'complete', detail: 'Configurable 5x5 impact/likelihood calculation engine' },
                { feature: 'Inherent vs Residual', status: 'complete', detail: 'Calculation of risk before and after control application' },
                { feature: 'Risk Scoring', status: 'complete', detail: 'Automated quantitative risk scoring algorithm' }
            ]
        },
        {
            id: 'treatment',
            title: 'Risk Treatment',
            standard: 'ISO 27005 Clause 9',
            icon: Shield,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            requirements: [
                'Select risk treatment options (Modify, Retain, Avoid, Share)',
                'Prepare a Risk Treatment Plan (RTP)',
                'Determine necessary controls to implement the chosen treatment'
            ],
            implementation: [
                { feature: 'Treatment Workflows', status: 'complete', detail: 'Structured workflows for Mitigation, Acceptance, Avoidance, Transfer' },
                { feature: 'Control Linking', status: 'complete', detail: 'Direct mapping of mitigating controls from the standard library' },
                { feature: 'RTP Generation', status: 'complete', detail: 'Automated generation of ISO-compliant Risk Treatment Plans' }
            ]
        },
        {
            id: 'monitoring',
            title: 'Monitoring & Review',
            standard: 'ISO 27005 Clause 12',
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            requirements: [
                'Continuously monitor risk factors and residual risks',
                'Monitor the effectiveness of risk treatment',
                'Review and update the risk assessment regularly'
            ],
            implementation: [
                { feature: 'Risk Dashboard', status: 'complete', detail: 'Real-time visualizations of risk profile and trends' },
                { feature: 'Review Reminders', status: 'complete', detail: 'Automated notifications for periodical risk re-assessment' },
                { feature: 'KRI Tracking', status: 'complete', detail: 'Key Risk Indicators monitoring and alerting' }
            ]
        }
    ];

    const nistAreas = [
        {
            id: 'prep',
            title: 'Prepare',
            standard: 'NIST 800-30 Step 1',
            icon: FileText,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            requirements: [
                'Identify the purpose of the assessment',
                'Identify the scope of the assessment',
                'Identify assumptions and constraints'
            ],
            implementation: [
                { feature: 'Context Builder', status: 'complete', detail: 'Documentation of organizational context and risk appetite' },
                { feature: 'Scope Definition', status: 'complete', detail: 'Asset boundaries and system categorization' },
                { feature: 'Roles', status: 'complete', detail: 'Assignment of Risk Managers and Owners' }
            ]
        },
        {
            id: 'conduct',
            title: 'Conduct Assessment',
            standard: 'NIST 800-30 Step 2',
            icon: Activity,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            requirements: [
                'Identify threat sources and events',
                'Identify vulnerabilities and predisposing conditions',
                'Determine likelihood and impact'
            ],
            implementation: [
                { feature: 'NIST Catalog', status: 'complete', detail: 'Built-in NIST 800-30 threat and vulnerability pairs' },
                { feature: 'Likelihood Scoring', status: 'complete', detail: 'Frequency-based likelihood estimation' },
                { feature: 'Impact Analysis', status: 'complete', detail: 'CIA triad impact assessment' }
            ]
        },
        {
            id: 'communicate',
            title: 'Communicate',
            standard: 'NIST 800-30 Step 3',
            icon: Search,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            requirements: [
                'Communicate risk assessment results',
                'Share risk information',
                'Support decision making'
            ],
            implementation: [
                { feature: 'Risk Register', status: 'complete', detail: 'Exportable registry of all assessed risks' },
                { feature: 'Executive Reports', status: 'complete', detail: 'High-level summaries for authorizing officials' },
                { feature: 'Dashboarding', status: 'complete', detail: 'Interactive views for stakeholders' }
            ]
        },
        {
            id: 'maintain',
            title: 'Maintain',
            standard: 'NIST 800-30 Step 4',
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            requirements: [
                'Monitor risk factors',
                'Update risk assessment',
                'Monitor compliance'
            ],
            implementation: [
                { feature: 'Continuous Monitoring', status: 'complete', detail: 'Automated re-evaluation triggers' },
                { feature: 'Trend Analysis', status: 'complete', detail: 'Historical tracking of risk reduction over time' },
                { feature: 'Control Validation', status: 'complete', detail: 'Linking control effectiveness to residual risk' }
            ]
        }
    ];

    const benefits = [
        { title: 'Decision Support', description: 'Data-driven insights for prioritizing security investments', icon: BarChart3 },
        { title: 'Compliance Evidence', description: 'Automatically generated reports for ISO 27001 audits', icon: FileText },
        { title: 'Proactive Security', description: 'Identify and address vulnerabilities before they are exploited', icon: Shield },
        { title: 'Cost Optimization', description: 'Focus resources on risks that exceed tolerance levels', icon: Scale }
    ];

    const currentAreas = framework === 'iso' ? isoAreas : nistAreas;

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 p-6 lg:p-10">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-6">
                        <div className="relative">
                            <div className="absolute top-0 right-0">
                                <PageGuide
                                    title="Framework Alignment"
                                    description="Visualize how your risk management program aligns with international standards."
                                    rationale="Demonstrating alignment with ISO 27005 or NIST 800-30 is critical for external audits and stakeholder confidence."
                                    howToUse={[
                                        { step: "Choose Framework", description: "Toggle between ISO and NIST views to see specific requirements." },
                                        { step: "Review Gaps", description: "Identify which steps of the risk management lifecycle are implemented." },
                                        { step: "Explain to Auditors", description: "Use this page to demonstrate your structured approach to risk." }
                                    ]}
                                />
                            </div>
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-600 text-white mb-4">
                                <Activity className="w-8 h-8" />
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                Risk Management
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                                Alignment with ISO 27005 and NIST SP 800-30
                            </p>
                        </div>

                        {/* Framework Toggle Tabs */}
                        <div className="flex justify-center">
                            <div className="inline-flex p-1 bg-slate-100 rounded-lg shadow-inner">
                                <button
                                    onClick={() => setFramework('iso')}
                                    className={cn(
                                        "px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200",
                                        framework === 'iso'
                                            ? "bg-white text-amber-600 shadow-sm ring-1 ring-slate-200"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                    )}
                                >
                                    ISO 27005 Aligned
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
                                    NIST 800-30 Ready
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Overview Card */}
                    <Card className="border-2 border-amber-200 bg-white shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                            <CardTitle className="text-2xl">
                                {framework === 'iso' ? 'Information Security Risk Management' : 'NIST Risk Assessment Guide'}
                            </CardTitle>
                            <CardDescription className="text-base">
                                {framework === 'iso'
                                    ? "ISO 27005 provides guidelines for information security risk management. Our platform systematically addresses risk identification, analysis, evaluation, and treatment."
                                    : "NIST SP 800-30 guides the risk assessment process. Our platform aligns with the steps of Preparing, Conducting, Communicating, and Maintaining risk assessments."
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-amber-50 rounded-lg">
                                    <div className="text-3xl font-bold text-amber-600">4</div>
                                    <div className="text-sm text-muted-foreground">Core Steps</div>
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
                                                <Shield className="w-5 h-5 text-amber-600" />
                                                Platform Implementation
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {area.implementation.map((impl, idx) => (
                                                    <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-amber-300 transition-colors">
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
                    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <BarChart3 className="w-6 h-6 text-amber-600" />
                                Strategic Value
                            </CardTitle>
                            <CardDescription>
                                Optimize security decisions with quantitative risk data
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {benefits.map((benefit, idx) => (
                                    <div key={idx} className="p-4 bg-white rounded-lg shadow-sm border border-amber-100 hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-amber-100 rounded-lg">
                                                <benefit.icon className="w-5 h-5 text-amber-600" />
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
