import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { Button } from '@complianceos/ui/ui/button';
import { CheckCircle2, Server, Flame, Activity, Stethoscope, BarChart3, ArrowRight, BookOpen, ArrowLeft, Info, CircleDashed, Users, Calendar } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Progress } from '@complianceos/ui/ui/progress';
import { format } from 'date-fns';
import { AssignProgramTaskModal } from '@/components/AssignProgramTaskModal';

export default function RiskProgramGuide() {
    const params = useParams();
    const clientId = parseInt(params.id || "0");

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedStep, setSelectedStep] = useState<any>(null);

    // Fetch data for dynamic progress tracking
    const { data: assignments, refetch: refetchAssignments } = trpc.programGuides.getAssignments.useQuery({
        clientId,
        guideType: 'risk'
    }, { enabled: !!clientId });

    const { data: assets } = trpc.risks.getAssets.useQuery({ clientId }, { enabled: !!clientId });
    const { data: threatModels } = trpc.threatModels.list.useQuery({ clientId }, { enabled: !!clientId });
    const { data: riskAssessments } = trpc.risks.getAll.useQuery({ clientId }, { enabled: !!clientId });

    // Determine completion logic per step
    const hasAssets = !!assets && assets.length > 0;
    const hasThreats = !!threatModels && threatModels.length > 0;
    const hasRisks = !!riskAssessments && riskAssessments.length > 0;
    const treatedRisks = riskAssessments?.filter((r: any) => r.treatmentOption && r.treatmentOption !== 'None').length || 0;
    const hasTreatments = treatedRisks > 0;
    const hasMonitored = !!riskAssessments && riskAssessments.some((r: any) => r.status === 'approved' || r.status === 'reviewed');

    const getStatus = (stepId: string) => {
        switch(stepId) {
            case 'assets': return hasAssets ? 'completed' : 'pending';
            case 'threats': return hasThreats ? 'completed' : 'pending';
            case 'assess': return hasRisks ? 'completed' : 'pending';
            case 'treat': return hasTreatments ? 'completed' : 'pending';
            case 'monitor': return hasMonitored ? 'completed' : 'pending';
            default: return 'pending';
        }
    };

    const steps = [
        {
            id: 'assets',
            step: 1,
            title: 'Define Assets',
            subtitle: 'Asset Inventory',
            description: 'The foundation of any risk program is knowing what you are protecting. Identify and register critical information assets, systems, and data repositories.',
            icon: Server,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            accent: 'from-blue-600 to-cyan-600',
            bestPractices: [
                'Assign an explicit owner to every asset.',
                'Value assets based on Confidentiality, Integrity, and Availability (CIA).',
                'Keep the inventory updated as infrastructure changes.'
            ],
            link: `/clients/${clientId}/risks/assets`,
            cta: 'Manage Assets',
            downloadText: 'Download Asset Inventory Template'
        },
        {
            id: 'threats',
            step: 2,
            title: 'Threat Modeling',
            subtitle: 'Threats & Vulnerabilities',
            description: 'Analyze potential threats and the vulnerabilities they might exploit against your assets. This establishes the context for your risk scenarios.',
            icon: Flame,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            accent: 'from-orange-500 to-red-500',
            bestPractices: [
                'Utilize established frameworks like STRIDE or MITRE ATT&CK.',
                'Regularly review new and emerging threats in your industry.',
                'Map specific vulnerabilities to the assets they affect.'
            ],
            link: `/clients/${clientId}/risks/threats`,
            cta: 'View Threat Library',
            downloadText: 'Download Threat Catalog (OWASP)'
        },
        {
            id: 'assess',
            step: 3,
            title: 'Risk Assessment',
            subtitle: 'Inherent Risk Scoring',
            description: 'Evaluate the likelihood and impact of threat events occurring. This gives you the Inherent Risk score before any mitigating controls are applied.',
            icon: Activity,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            accent: 'from-red-600 to-rose-600',
            bestPractices: [
                'Use a consistent qualitative or quantitative scoring methodology (e.g., 5x5 matrix).',
                'Involve asset owners in assessing likelihood and impact.',
                'Document the rationale behind each assessment score.'
            ],
            link: `/clients/${clientId}/risks/assessments`,
            cta: 'Perform Assessments',
            downloadText: 'Download 5x5 Risk Matrix Template'
        },
        {
            id: 'treat',
            step: 4,
            title: 'Treatment Plan',
            subtitle: 'Assign Controls',
            description: 'Determine how to handle unacceptable risks. Options include mitigating (applying controls), transferring (insurance), avoiding, or accepting the risk.',
            icon: Stethoscope,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            accent: 'from-emerald-500 to-teal-500',
            bestPractices: [
                'Select controls that provide the best ROI for risk reduction.',
                'Assign clear ownership and deadlines for implementing treatment plans.',
                'Ensure accepted risks are formally signed off by management.'
            ],
            link: `/clients/${clientId}/risks/treatment-plan`,
            cta: 'Create Treatment Plans',
            downloadText: 'Download Risk Acceptance Form'
        },
        {
            id: 'monitor',
            step: 5,
            title: 'Review & Report',
            subtitle: 'Residual Risk Monitoring',
            description: 'After treatments are applied, calculate the Residual Risk. Continuously monitor the effectiveness of controls and track Key Risk Indicators (KRIs).',
            icon: BarChart3,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            accent: 'from-purple-600 to-fuchsia-600',
            bestPractices: [
                'Review the Risk Register at least annually or upon major changes.',
                'Establish KRIs that provide early warning of increasing risk.',
                'Report aggregate risk posture to executive leadership.'
            ],
            link: `/clients/${clientId}/risks/report`,
            cta: 'View Risk Analytics',
            downloadText: 'Download Executive Report Template'
        }
    ];

    const completedSteps = steps.filter(s => getStatus(s.id) === 'completed').length;
    const progressPercentage = Math.round((completedSteps / steps.length) * 100);

    return (
        <DashboardLayout>
            <div className="relative min-h-screen bg-slate-50 p-6 lg:p-10">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex justify-between items-center">
                        <Link href={`/clients/${clientId}/risks/dashboard`}>
                            <Button variant="ghost" className="text-slate-500 hover:text-slate-900">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Risk Dashboard
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
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-700 mb-4 shadow-sm border border-red-200">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                            Risk Management Program Guide
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                            A dynamic, step-by-step roadmap to implement an ISO 27005 aligned information security risk management process.
                        </p>
                    </div>

                    <div className="my-10 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-slate-900">Program Implementation Progress</h3>
                            <span className="text-sm font-medium text-slate-600">{progressPercentage}% Complete</span>
                        </div>
                        <Progress value={progressPercentage} className="h-3 rounded-full" />
                        <p className="text-xs text-slate-500 mt-4 text-center">
                            Completion based on real-time data from your dashboard. Complete all stages to fully initialize the program.
                        </p>
                    </div>

                    <div className="space-y-12 relative pb-12">
                        <div className="absolute top-12 bottom-12 left-[31px] w-0.5 bg-slate-200 z-0 hidden sm:block"></div>

                        {steps.map((step) => {
                            const status = getStatus(step.id);
                            return (
                                <div key={step.id} className="relative z-10 flex flex-col sm:flex-row gap-6 lg:gap-8 group">
                                    <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-md border-2 border-white ring-1 ring-slate-100 group-hover:ring-red-200 transition-all duration-300">
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
                        <Link href={`/clients/${clientId}/risks/dashboard`}>
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
                    guideType="risk"
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
