import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { Button } from '@complianceos/ui/ui/button';
import { CheckCircle2, Shield, Users, Target, FileText, Zap, AlertTriangle, ArrowRight, BookOpen, ArrowLeft, Info, CircleDashed, Calendar } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Progress } from '@complianceos/ui/ui/progress';
import { format } from 'date-fns';
import { AssignProgramTaskModal } from '@/components/AssignProgramTaskModal';

export default function GovernanceProgramGuide() {
    const params = useParams();
    const clientId = parseInt(params.id || "0");

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedStep, setSelectedStep] = useState<any>(null);

    // Fetch data for dynamic progress tracking
    const { data: assignments, refetch: refetchAssignments } = trpc.programGuides.getAssignments.useQuery({
        clientId,
        guideType: 'governance'
    }, { enabled: !!clientId });

    const { data: readinessData } = trpc.compliance.getReadinessData.useQuery({ clientId }, { enabled: !!clientId });
    const { data: riskAssessments } = trpc.risks.getAll.useQuery({ clientId }, { enabled: !!clientId });

    // Determine completion logic per step
    const policyCount = readinessData?.coverage?.policyStats?.total || 0;
    const controlCount = readinessData?.coverage?.controlStats?.total || 0;
    const hasRisks = !!riskAssessments && riskAssessments.length > 0;

    const getStatus = (stepId: string) => {
        switch(stepId) {
            case 'roles': return 'pending'; // Requires people integration
            case 'controls': return controlCount > 0 ? 'completed' : 'pending';
            case 'risks': return hasRisks ? 'completed' : 'pending';
            case 'policies': return policyCount > 0 ? 'completed' : 'pending';
            case 'automate': return 'pending'; // Check workflows integration
            case 'plan': return 'pending'; // Check roadmap integration
            default: return 'pending';
        }
    };

    const steps = [
        {
            id: 'roles',
            step: 1,
            title: 'Define Roles & Accountability',
            subtitle: 'RACI Matrix',
            description: 'Establishing a clear governance structure begins with people. A RACI matrix (Responsible, Accountable, Consulted, Informed) eliminates ambiguity and ensures every aspect of your security program has an owner.',
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            accent: 'from-blue-600 to-cyan-600',
            bestPractices: [
                'Assign only one Accountable person per control or policy to prevent diffusion of responsibility.',
                'Map roles (e.g., CISO, DB Admin) rather than specific names to ensure continuity during staff changes.',
                'Use the system\'s People Registry to maintain a single source of truth for all internal and external stakeholders.'
            ],
            link: `/clients/${clientId}/raci-matrix`,
            cta: 'Configure RACI Matrix',
            downloadText: 'Download RACI Template'
        },
        {
            id: 'controls',
            step: 2,
            title: 'Implement Security Controls',
            subtitle: 'Deploy Defenses',
            description: 'Controls are the operational, technical, and managerial safeguards used to mitigate risk. Implementing controls based on standardized frameworks ensures comprehensive defense-in-depth.',
            icon: Shield,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            accent: 'from-emerald-600 to-teal-600',
            bestPractices: [
                'Start with a widely accepted baseline framework like ISO 27001, CIS Controls, or NIST CSF.',
                'Document the implementation status (e.g., Not Implemented, Partially Implemented, Fully Implemented).',
                'Map local controls to multiple framework requirements to satisfy overlapping audits efficiently.'
            ],
            link: `/clients/${clientId}/controls`,
            cta: 'Manage Controls',
            downloadText: 'Download Controls Matrix'
        },
        {
            id: 'risks',
            step: 3,
            title: 'Assess and Mitigate Risk',
            subtitle: 'Risk Register',
            description: 'Risk management is the engine of governance. By systematically identifying threats, assessing vulnerabilities, and calculating business impact, you ensure resources are allocated where they are needed most.',
            icon: AlertTriangle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            accent: 'from-orange-500 to-red-500',
            bestPractices: [
                'Utilize a standardized 5x5 matrix for Likelihood and Impact to produce objective risk scores.',
                'Link identified risks to the mitigating controls established in Step 2.',
                'Assign actionable treatment plans (Accept, Mitigate, Transfer, Avoid) for all high and critical risks.'
            ],
            link: `/clients/${clientId}/risk-register`,
            cta: 'Open Risk Register',
            downloadText: 'Download Gap Assessment form'
        },
        {
            id: 'policies',
            step: 4,
            title: 'Codify in Policies',
            subtitle: 'Draft & Approve',
            description: 'Policies represent management\'s intent and effectively communicate expectations to the workforce. They act as the foundational rulebook for all subsequent security activities.',
            icon: FileText,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            accent: 'from-amber-500 to-yellow-600',
            bestPractices: [
                'Keep policies concise, high-level, and technology-agnostic (put specific technical details in Standards/Procedures).',
                'Enforce an annual review cycle to ensure policies remain aligned with business objectives.',
                'Track employee attestation (acknowledgement) to demonstrate an active culture of compliance.'
            ],
            link: `/clients/${clientId}/policies`,
            cta: 'Draft Policies',
            downloadText: 'Download Policy Templates'
        },
        {
            id: 'automate',
            step: 5,
            title: 'Automate Evidence Collection',
            subtitle: 'Workflows',
            description: 'Manual evidence collection leads to compliance fatigue and human error. Automating workflows transforms compliance from a point-in-time audit to a continuous, real-time posture.',
            icon: Zap,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            accent: 'from-purple-600 to-violet-600',
            bestPractices: [
                'Integrate with cloud providers (AWS, Azure) to automatically verify configuration controls (e.g., S3 encryption).',
                'Set up recurring automated tasks for periodic human-required activities (e.g., quarterly access reviews).',
                'Alert control owners immediately when an automated check fails, enabling proactive remediation.'
            ],
            link: `/clients/${clientId}/workflows`,
            cta: 'Setup Automations',
            downloadText: 'Download Automation Playbooks'
        },
        {
            id: 'plan',
            step: 6,
            title: 'Continuous Planning',
            subtitle: 'Roadmap',
            description: 'Governance is not a destination, but a continuous cycle of improvement. A strategic roadmap aligns upcoming security initiatives with budget cycles and business growth.',
            icon: Target,
            color: 'text-pink-600',
            bgColor: 'bg-pink-50',
            accent: 'from-pink-500 to-rose-500',
            bestPractices: [
                'Generate a Gap Analysis report against your target framework to identify missing requirements.',
                'Convert gaps into actionable roadmap items with assigned owners and target completion dates.',
                'Regularly measure your Governance Health Score to track progress over time.'
            ],
            link: `/clients/${clientId}/roadmap/dashboard`,
            cta: 'View Roadmap',
            downloadText: 'Download Gap Analysis Guide'
        }
    ];

    const completedSteps = steps.filter(s => getStatus(s.id) === 'completed').length;
    const progressPercentage = Math.round((completedSteps / steps.length) * 100);

    return (
        <DashboardLayout>
            <div className="relative min-h-screen bg-slate-50 p-6 lg:p-10">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <Link href={`/clients/${clientId}/governance`}>
                            <Button variant="ghost" className="text-slate-500 hover:text-slate-900">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Governance Dashboard
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
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 mb-4 shadow-sm border border-indigo-200">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                            Governance Program Guide
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                            A dynamic, comprehensive step-by-step methodology to establish a robust, modern GRC program from the ground up.
                        </p>
                    </div>

                    <div className="my-10 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-slate-900">Program Implementation Progress</h3>
                            <span className="text-sm font-medium text-slate-600">{progressPercentage}% Complete</span>
                        </div>
                        <Progress value={progressPercentage} className="h-3 rounded-full" />
                        <p className="text-xs text-slate-500 mt-4 text-center">
                            Completion based on real-time program data. Complete all stages to fully initialize the program.
                        </p>
                    </div>

                    {/* Timeline / Stepper */}
                    <div className="space-y-12 relative pb-12">
                        {/* Connecting Line */}
                        <div className="absolute top-12 bottom-12 left-[31px] w-0.5 bg-slate-200 z-0 hidden sm:block"></div>

                        {steps.map((step) => {
                            const status = getStatus(step.id);
                            return (
                                <div key={step.id} className="relative z-10 flex flex-col sm:flex-row gap-6 lg:gap-8 group">
                                    {/* Step Indicator */}
                                    <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-md border-2 border-white ring-1 ring-slate-100 group-hover:ring-indigo-200 transition-all duration-300">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${status === 'completed' ? 'from-emerald-500 to-green-600' : step.accent} text-white shadow-inner`}>
                                            {status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-black text-xl">{step.step}</span>}
                                        </div>
                                    </div>

                                    {/* Content Card */}
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

                    {/* Footer Summary */}
                    <div className="mt-12 text-center pb-20">
                        <Link href={`/clients/${clientId}/governance`}>
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
                    guideType="governance"
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
