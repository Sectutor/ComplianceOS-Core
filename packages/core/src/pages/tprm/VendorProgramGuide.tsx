import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { Button } from '@complianceos/ui/ui/button';
import { CheckCircle2, Search, ShieldAlert, FileCheck, FileText, Activity, ArrowRight, BookOpen, ArrowLeft, Info, CircleDashed, Users, Calendar } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Progress } from '@complianceos/ui/ui/progress';
import { format } from 'date-fns';
import { AssignProgramTaskModal } from '@/components/AssignProgramTaskModal';

export default function VendorProgramGuide() {
    const params = useParams();
    const clientId = parseInt(params.id || "0");

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedStep, setSelectedStep] = useState<any>(null);

    // Fetch data for dynamic progress tracking
    const { data: assignments, refetch: refetchAssignments } = trpc.programGuides.getAssignments.useQuery({
        clientId,
        guideType: 'tprm'
    }, { enabled: !!clientId });

    const { data: stats } = trpc.vendors.getStats.useQuery({ clientId }, { enabled: !!clientId });

    // Determine completion logic per step
    const totalVendors = stats?.vendorTiers?.reduce((acc: number, item: any) => acc + item.value, 0) || 0;
    const hasVendors = totalVendors > 0;
    const hasAssessments = stats?.statusBreakdown && (stats.statusBreakdown.under_review > 0 || stats.statusBreakdown.completed > 0 || stats.statusBreakdown.pending > 0);
    const hasCompletedAssessments = stats?.statusBreakdown && stats.statusBreakdown.completed > 0;

    const getStatus = (stepId: string) => {
        switch(stepId) {
            case 'onboarding': return hasVendors ? 'completed' : 'pending';
            case 'questionnaires': return !!hasAssessments ? 'completed' : 'pending';
            case 'evidence': return !!hasCompletedAssessments ? 'completed' : 'pending';
            case 'contracting': return !!hasCompletedAssessments ? 'completed' : 'pending';
            case 'monitor': return !!hasCompletedAssessments ? 'completed' : 'pending';
            default: return 'pending';
        }
    };

    const steps = [
        {
            id: 'onboarding',
            step: 1,
            title: 'Vendor Onboarding',
            subtitle: 'Discovery & Categorization',
            description: 'Begin by identifying all third-party vendors that interact with your organization. Classify them into risk tiers based on their access to sensitive data and criticality to business operations.',
            icon: Search,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            accent: 'from-blue-600 to-cyan-600',
            bestPractices: [
                'Maintain a centralized, single source of truth for all vendor relationships.',
                'Require a business sponsor and justification for every new vendor.',
                'Categorize vendors strictly (e.g., High, Medium, Low risk) to dictate assessment depth.'
            ],
            link: `/clients/${clientId}/vendors/discovery`,
            cta: 'Discover Vendors',
            downloadText: 'Download Onboarding Checklist'
        },
        {
            id: 'questionnaires',
            step: 2,
            title: 'Security Questionnaires',
            subtitle: 'Initial Assessment',
            description: 'Evaluate the security posture of your vendors using industry-standard questionnaires (like SIG, CAIQ, or custom forms) tailored to their assigned risk tier.',
            icon: ShieldAlert,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            accent: 'from-amber-500 to-orange-500',
            bestPractices: [
                'Use standard frameworks (SIG, CAIQ) to speed up vendor response times.',
                'Only ask questions relevant to the service provided and data accessed.',
                'Automate the follow-up process for unresponsive vendors.'
            ],
            link: `/clients/${clientId}/vendors/reviews`,
            cta: 'Send Questionnaires',
            downloadText: 'Download Standard Questionnaire'
        },
        {
            id: 'evidence',
            step: 3,
            title: 'Evidence Review',
            subtitle: 'Validation & Risk Analysis',
            description: 'Trust but verify. Analyze the questionnaire responses and review supporting evidence such as SOC 2 reports, ISO certificates, and penetration testing summaries.',
            icon: FileCheck,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            accent: 'from-purple-600 to-indigo-600',
            bestPractices: [
                'Do not accept "Yes" answers to critical controls without accompanying evidence.',
                'Identify and document specific control gaps as vendor risks.',
                'Validate that independent reports (like SOC 2) have unqualified opinions.'
            ],
            link: `/clients/${clientId}/vendors/reviews`,
            cta: 'Review Findings',
            downloadText: 'Download Evidence Matrix'
        },
        {
            id: 'contracting',
            step: 4,
            title: 'Contracting (DPAs)',
            subtitle: 'Legal & Compliance Binding',
            description: 'Ensure that the security requirements and expectations are legally binding through Master Services Agreements (MSAs), Security Addendums, and Data Processing Agreements (DPAs).',
            icon: FileText,
            color: 'text-rose-600',
            bgColor: 'bg-rose-50',
            accent: 'from-rose-500 to-red-500',
            bestPractices: [
                'Require vendors to notify you of breaches within a strict timeframe (e.g., 48 hours).',
                'Include Right to Audit clauses for critical Tier 1 vendors.',
                'Ensure sub-processor chains are documented and approved.'
            ],
            link: `/clients/${clientId}/vendors/dpa-manager`,
            cta: 'Manage Contracts',
            downloadText: 'Download DPA Template'
        },
        {
            id: 'monitor',
            step: 5,
            title: 'Continuous Monitoring',
            subtitle: 'Lifecycle Management',
            description: 'Vendor risk changes over time. Continuously monitor your ecosystem using threat intelligence feeds and conduct periodic reassessments based on vendor tier.',
            icon: Activity,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            accent: 'from-emerald-500 to-teal-500',
            bestPractices: [
                'Reassign vendors annually: Tier 1 (yearly), Tier 2 (bi-annually), Tier 3 (at renewal).',
                'Monitor external attack surface intelligence for early breach indicators.',
                'Establish a clear offboarding process to ensure data deletion upon termination.'
            ],
            link: `/clients/${clientId}/vendors/overview`,
            cta: 'Monitor Ecosystem',
            downloadText: 'Download KRI Dashboard Guide'
        }
    ];

    const completedSteps = steps.filter(s => getStatus(s.id) === 'completed').length;
    const progressPercentage = Math.round((completedSteps / steps.length) * 100);

    return (
        <DashboardLayout>
            <div className="relative min-h-screen bg-slate-50 p-6 lg:p-10">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex justify-between items-center">
                        <Link href={`/clients/${clientId}/vendors`}>
                            <Button variant="ghost" className="text-slate-500 hover:text-slate-900">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Vendor Dashboard
                            </Button>
                        </Link>
                        {progressPercentage === 100 && (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Program Fully Initialized
                            </Badge>
                        )}
                    </div>
                    
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mb-4 shadow-sm border border-emerald-200">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                            Vendor Risk Program Guide
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                            A dynamic, structured methodology for implementing a robust Third-Party Risk Management (TPRM) program.
                        </p>
                    </div>

                    <div className="my-10 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-slate-900">Program Implementation Progress</h3>
                            <span className="text-sm font-medium text-slate-600">{progressPercentage}% Complete</span>
                        </div>
                        <Progress value={progressPercentage} className="h-3 rounded-full" />
                        <p className="text-xs text-slate-500 mt-4 text-center">
                            Completion based on real-time assessments and vendor data. Complete all stages to fully initialize the program.
                        </p>
                    </div>

                    <div className="space-y-12 relative pb-12">
                        <div className="absolute top-12 bottom-12 left-[31px] w-0.5 bg-slate-200 z-0 hidden sm:block"></div>

                        {steps.map((step) => {
                            const status = getStatus(step.id);
                            return (
                                <div key={step.id} className="relative z-10 flex flex-col sm:flex-row gap-6 lg:gap-8 group">
                                    <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-md border-2 border-white ring-1 ring-slate-100 group-hover:ring-emerald-200 transition-all duration-300">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${status === 'completed' ? 'from-emerald-500 to-green-600' : step.accent} text-white shadow-inner`}>
                                            {status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-black text-xl">{step.step}</span>}
                                        </div>
                                    </div>

                                    <Card className={`flex-grow transition-shadow ${status === 'completed' ? 'border-emerald-200 shadow-emerald-100/50' : 'border-slate-200 hover:shadow-md'}`}>
                                        <CardHeader className={`${status === 'completed' ? 'bg-emerald-50/50' : step.bgColor} border-b border-white rounded-t-xl bg-opacity-50`}>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <Badge variant="outline" className={`mb-2 bg-white ${status === 'completed' ? 'text-emerald-700 border-emerald-200' : step.color + ' border-current'}`}>
                                                        Phase {step.step}: {step.subtitle}
                                                    </Badge>
                                                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                                                        <step.icon className={`w-6 h-6 ${status === 'completed' ? 'text-emerald-600' : step.color}`} />
                                                        {step.title}
                                                    </CardTitle>
                                                </div>
                                                {status === 'completed' ? (
                                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                                        Completed
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 flex items-center gap-1">
                                                        <CircleDashed className="w-3 h-3" /> Needs Attention
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-6">
                                            <p className="text-slate-700 leading-relaxed text-lg">
                                                {step.description}
                                            </p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                                                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                        Best Practices
                                                    </h4>
                                                    <ul className="space-y-3">
                                                        {step.bestPractices.map((practice, i) => (
                                                            <li key={i} className="flex items-start gap-3 text-slate-600">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0"></div>
                                                                <span className="leading-relaxed text-sm">{practice}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                                            <Users className="w-5 h-5 text-indigo-500" />
                                                            Task Assignment
                                                        </h4>
                                                        <p className="text-sm text-slate-500 mb-4">Assign this phase to a team member and set a target deadline.</p>
                                                        
                                                        <div className="space-y-3 border-t border-slate-100 pt-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-medium text-slate-500 uppercase">Owner</span>
                                                                <span className="text-sm text-slate-800 font-medium">{assignments?.[step.id]?.owner || 'Unassigned'}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1"><Calendar className="w-3 h-3"/> Target Date</span>
                                                                <span className="text-sm text-slate-800 font-medium">{assignments?.[step.id]?.targetDate ? format(new Date(assignments[step.id].targetDate), 'MMM d, yyyy') : 'Not set'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4">
                                                        <Button variant="outline" size="sm" className="w-full" onClick={() => { setSelectedStep(step); setIsAssignModalOpen(true); }}>
                                                            Manage Assignment
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="pt-2 flex flex-wrap gap-3 items-center">
                                                <Link href={step.link}>
                                                    <Button className={`bg-gradient-to-r ${status === 'completed' ? 'from-emerald-500 to-green-600' : step.accent} hover:opacity-90 text-white font-medium shadow-md transition-all group-hover:translate-x-1`}>
                                                        {step.cta} <ArrowRight className="w-4 h-4 ml-2" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12 text-center pb-20">
                        <Link href={`/clients/${clientId}/vendors`}>
                            <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-14 rounded-full shadow-lg hover:shadow-xl transition-all">
                                Return to Dashboard
                            </Button>
                        </Link>
                    </div>

                </div>
            </div>

            {selectedStep && (
                <AssignProgramTaskModal 
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                    clientId={clientId}
                    guideType="tprm"
                    stepId={selectedStep.id}
                    stepTitle={selectedStep.title}
                    currentUserId={assignments?.[selectedStep.id]?.ownerId}
                    currentTargetDate={assignments?.[selectedStep.id]?.targetDate}
                    onAssignmentUpdated={() => refetchAssignments()}
                />
            )}
        </DashboardLayout>
    );
}
