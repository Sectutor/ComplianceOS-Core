import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { Button } from '@complianceos/ui/ui/button';
import { CheckCircle2, Activity, AlertTriangle, FileText, PhoneCall, PlayCircle, ArrowRight, BookOpen, ArrowLeft, Info, CircleDashed, Users, Calendar } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Progress } from '@complianceos/ui/ui/progress';
import { format } from 'date-fns';
import { AssignProgramTaskModal } from '@/components/AssignProgramTaskModal';

export default function BCPProgramGuide() {
    const params = useParams();
    const clientId = parseInt(params.id || "0");

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedStep, setSelectedStep] = useState<any>(null);

    // Fetch data for dynamic progress tracking
    const { data: assignments, refetch: refetchAssignments } = trpc.programGuides.getAssignments.useQuery({
        clientId,
        guideType: 'business-continuity'
    }, { enabled: !!clientId });

    const { data: processes } = trpc.businessContinuity.processes.list.useQuery({ clientId }, { enabled: !!clientId });
    const { data: exercises } = trpc.businessContinuity.exercises.listAll.useQuery({ clientId }, { enabled: !!clientId });
    const { data: plans } = trpc.businessContinuity.plans.listByClient.useQuery({ clientId }, { enabled: !!clientId });
    const { data: scenarios } = trpc.businessContinuity.scenarios.list.useQuery({ clientId }, { enabled: !!clientId });

    // Determine completion logic per step
    const hasProcesses = !!processes && processes.length > 0;
    const hasScenarios = !!scenarios && scenarios.length > 0;
    const hasPlans = !!plans && plans.length > 0;
    const hasExercises = !!exercises && exercises.length > 0;

    const getStatus = (stepId: string) => {
        switch(stepId) {
            case 'bia': return hasProcesses ? 'completed' : 'pending';
            case 'scenarios': return hasScenarios ? 'completed' : 'pending';
            case 'plans': return hasPlans ? 'completed' : 'pending';
            case 'calltrees': return 'pending'; // Requires call tree integration
            case 'exercises': return hasExercises ? 'completed' : 'pending';
            default: return 'pending';
        }
    };

    const steps = [
        {
            id: 'bia',
            step: 1,
            title: 'Business Impact Analysis (BIA)',
            subtitle: 'Identify Critical Functions',
            description: 'Determine which business functions are most critical to your organization. Establish Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO) based on the cost of downtime.',
            icon: Activity,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            accent: 'from-blue-600 to-cyan-600',
            bestPractices: [
                'Involve department heads to accurately quantify financial and operational impacts.',
                'Identify upstream and downstream dependencies for each critical function.',
                'Prioritize functions into tiers (e.g., Tier 1: recovering within 24h).'
            ],
            link: `/clients/${clientId}/business-continuity/bia`,
            cta: 'Conduct BIA',
            downloadText: 'Download BIA Template'
        },
        {
            id: 'scenarios',
            step: 2,
            title: 'Disruptive Scenarios',
            subtitle: 'Risk Evaluation',
            description: 'Evaluate the likelihood and impact of specific disaster scenarios (e.g., ransomware, natural disasters, facility loss) that could disrupt your critical operations.',
            icon: AlertTriangle,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            accent: 'from-amber-500 to-orange-500',
            bestPractices: [
                'Consider both physical (facility loss) and digital (ransomware) threats.',
                'Evaluate supply chain disruptions and critical vendor failures.',
                'Use risk assessments to drive which scenarios require detailed recovery plans.'
            ],
            link: `/clients/${clientId}/business-continuity/scenarios`,
            cta: 'Analyze Risks',
            downloadText: 'Download Scenario Matrix'
        },
        {
            id: 'plans',
            step: 3,
            title: 'Recovery Plan Building',
            subtitle: 'Actionable BCP/DR Plans',
            description: 'Develop detailed Business Continuity Plans (BCP) and Disaster Recovery (DR) procedures targeting the recovery of the critical functions and IT systems identified in the BIA.',
            icon: FileText,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            accent: 'from-indigo-600 to-purple-600',
            bestPractices: [
                'Ensure plans are concise, actionable, and checklist-based during a crisis.',
                'Designate alternate processing facilities and backup infrastructure.',
                'Store copies of the recovery plans in secure, off-network locations.'
            ],
            link: `/clients/${clientId}/business-continuity/plans`,
            cta: 'Build Plans',
            downloadText: 'Download Plan Outline'
        },
        {
            id: 'calltrees',
            step: 4,
            title: 'Call Trees & Communication',
            subtitle: 'Crisis Communications',
            description: 'Establish clear communication protocols to notify employees, management, customers, and regulators during an incident.',
            icon: PhoneCall,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            accent: 'from-emerald-500 to-teal-500',
            bestPractices: [
                'Maintain up-to-date emergency contact information for all staff.',
                'Determine predefined spokespeople for internal and external communications.',
                'Implement an alternate communication channel if standard systems (like email) are down.'
            ],
            link: `/clients/${clientId}/business-continuity/call-trees`,
            cta: 'Configure Comm. Trees',
            downloadText: 'Download Call Tree Template'
        },
        {
            id: 'exercises',
            step: 5,
            title: 'Tabletop Exercises',
            subtitle: 'Testing & Maintenance',
            description: 'A plan is only as good as its last test. Regularly conduct tabletop exercises and simulations to validate the effectiveness of your BCP and train personnel.',
            icon: PlayCircle,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            accent: 'from-purple-600 to-fuchsia-600',
            bestPractices: [
                'Schedule tabletop exercises at least annually involving key executives.',
                'Use realistic, dynamic scenarios that test the limits of your recovery procedures.',
                'Document lessons learned in an After Action Report (AAR) and update plans accordingly.'
            ],
            link: `/clients/${clientId}/business-continuity/exercises`,
            cta: 'Schedule Exercises',
            downloadText: 'Download Exercise Ideas'
        }
    ];

    const completedSteps = steps.filter(s => getStatus(s.id) === 'completed').length;
    const progressPercentage = Math.round((completedSteps / steps.length) * 100);

    return (
        <DashboardLayout>
            <div className="relative min-h-screen bg-slate-50 p-6 lg:p-10">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex justify-between items-center">
                        <Link href={`/clients/${clientId}/business-continuity`}>
                            <Button variant="ghost" className="text-slate-500 hover:text-slate-900">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Continuity Dashboard
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
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-100 text-violet-700 mb-4 shadow-sm border border-violet-200">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                            Business Continuity Program Guide
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                            A dynamic, structured guide to building resilience and preparing for organizational disruptions based on ISO 22301.
                        </p>
                    </div>

                    <div className="my-10 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-slate-900">Program Implementation Progress</h3>
                            <span className="text-sm font-medium text-slate-600">{progressPercentage}% Complete</span>
                        </div>
                        <Progress value={progressPercentage} className="h-3 rounded-full" />
                        <p className="text-xs text-slate-500 mt-4 text-center">
                            Completion based on real-time BCP continuity records. Complete all stages to fully initialize the program.
                        </p>
                    </div>

                    <div className="space-y-12 relative pb-12">
                        <div className="absolute top-12 bottom-12 left-[31px] w-0.5 bg-slate-200 z-0 hidden sm:block"></div>

                        {steps.map((step) => {
                            const status = getStatus(step.id);
                            return (
                                <div key={step.id} className="relative z-10 flex flex-col sm:flex-row gap-6 lg:gap-8 group">
                                    <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-md border-2 border-white ring-1 ring-slate-100 group-hover:ring-violet-200 transition-all duration-300">
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
                        <Link href={`/clients/${clientId}/business-continuity`}>
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
                    guideType="business-continuity"
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
