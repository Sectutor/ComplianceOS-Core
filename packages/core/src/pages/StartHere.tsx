import React, { useState } from 'react';
import { useLocation } from 'wouter';
import {
    Shield,
    FileCheck,
    Award,
    Activity,
    ArrowRight,
    CheckCircle2,
    PlayCircle,
    LayoutDashboard,
    Search,
    BookOpen,
    BarChart3,
    Building2,
    AlertTriangle,
    FileText,
    Info
} from 'lucide-react';
import { Button } from '@complianceos/ui/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@complianceos/ui/ui/tooltip";

// Type definitions for Workflows
type WorkflowStep = {
    title: string;
    description: string;
    link: string;
    icon?: React.ReactNode;
    details?: string;
};

type Workflow = {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    goal: string;
    primaryActionLink: string;
    infographicSteps: WorkflowStep[];
};

const WORKFLOWS: Workflow[] = [
    {
        id: 'risk-assessment',
        title: 'Risk Assessment',
        description: 'Identify, analyze, and evaluate security risks to your organization.',
        icon: <Shield className="h-8 w-8" />,
        color: 'text-emerald-400',
        goal: 'Complete a comprehensive risk register and treatment plan.',
        primaryActionLink: '/risks',
        infographicSteps: [
            {
                title: 'Identify Assets',
                description: 'Catalog your critical information assets (hardware, software, data).',
                link: '/clients/select/risks/assets',
                details: 'Create a comprehensive inventory of all information assets, including hardware, software, and data. Assign owners and classification levels.'
            },
            {
                title: 'Identify Risks',
                description: 'Determine threats and vulnerabilities affecting your assets.',
                link: '/clients/select/risks/register',
                details: 'Identify potential threats and vulnerabilities that could impact the confidentiality, integrity, or availability of your assets.'
            },
            {
                title: 'Assess Impact',
                description: 'Score risks based on likelihood and impact.',
                link: '/clients/select/risks/assessments',
                details: 'Evaluate the likelihood and potential impact of each risk. Calculate risk scores to prioritize mitigation efforts.'
            },
            {
                title: 'Treat Risks',
                description: 'Decide to mitigate, accept, avoid, or transfer risks.',
                link: '/clients/select/risks/treatment-plan',
                details: 'Select appropriate risk treatment options (mitigate, transfer, avoid, accept) and develop a plan to implement controls.'
            }
        ]
    },
    {
        id: 'gap-analysis',
        title: 'Gap Analysis',
        description: 'Assess your current security posture against industry standards.',
        icon: <Search className="h-8 w-8" />,
        color: 'text-blue-400',
        goal: 'Identify compliance gaps and create a remediation roadmap.',
        primaryActionLink: '/gap-analysis',
        infographicSteps: [
            {
                title: 'Select Framework',
                description: 'Define your target standard (ISO 27001, SOC 2, NIST).',
                link: '/clients/select/gap-analysis/new',
                details: 'Choose the security standard you want to align with (e.g., ISO 27001, SOC 2, NIST CSF). This sets the baseline requirements for your assessment.'
            },
            {
                title: 'Current State Assessment',
                description: 'Evaluate existing controls against framework requirements.',
                link: '/clients/select/gap-analysis',
                details: 'Review your organization\'s current policies, procedures, and technical controls. Interview stakeholders to understand actual practices versus documented processes.'
            },
            {
                title: 'Gap Identification',
                description: 'Analyze shortcomings and calculate compliance score.',
                link: '/clients/select/gap-analysis',
                details: 'Compare your current state against the framework\'s requirements. Identify areas where controls are missing, ineffective, or undocumented to calculate your initial compliance score.'
            },
            {
                title: 'Remediation Roadmap',
                description: 'Prioritize and plan tasks to close identified gaps.',
                link: '/clients/select/projects',
                details: 'Develop a prioritized action plan to address identified gaps. Assign owners, set deadlines, and estimate resources needed to reach full compliance.'
            }
        ]
    },
    {
        id: 'iso-certification',
        title: 'ISO 27001 Certification',
        description: 'The end-to-end journey to achieving ISO 27001 certification.',
        icon: <Award className="h-8 w-8" />,
        color: 'text-purple-400',
        goal: 'Prepare your organization for a successful external audit.',
        primaryActionLink: '/learning/iso-27001/checklist',
        infographicSteps: [
            {
                title: 'Foundation & Scope',
                description: 'Define scope, context (Clauses 4.1/4.2), and conduct gap analysis.',
                link: '/gap-analysis',
                details: 'Start by securing leadership commitment (Clause 5) and clearly defining what is included in your Information Security Management System (ISMS) scope (Clause 4.3). Conduct a gap analysis to see where you stand.'
            },
            {
                title: 'Risk Management & SoA',
                description: 'Assess risks, develop Treatment Plan, and define Statement of Applicability.',
                link: '/clients/select/risks/register',
                details: 'Identify assets, threats, and vulnerabilities (Clause 6.1.2). Evaluate risk likelihood and impact. Develop a Risk Treatment Plan (Clause 6.1.3) and select Annex A controls for your Statement of Applicability (SoA).'
            },
            {
                title: 'Implementation',
                description: 'Deploy Annex A controls, write policies, and train staff.',
                link: '/client-policies',
                details: 'Operationalize your ISMS. Write mandatory policies (Clause 5.2), implement selected security controls (Annex A), and ensure all staff undergo security awareness training (Clause 7.2/7.3).'
            },
            {
                title: 'Internal Audit & Review',
                description: 'Validate ISMS effectiveness and perform management review.',
                link: '/audit-readiness',
                details: 'Conduct an independent internal audit (Clause 9.2) to check for non-conformities. Top management must review the ISMS performance and audit results (Clause 9.3) before the external audit.'
            },
            {
                title: 'Certification Audits',
                description: 'Complete Stage 1 & Stage 2 external audits for final certification.',
                link: '/clients/select/projects',
                details: 'Engage an accredited body. Stage 1 checks your documentation readiness. Stage 2 is the main audit checking evidence of effectiveness. Clear any non-conformities to receive your certificate.'
            }
        ]
    },
    {
        id: 'business-continuity',
        title: 'Business Continuity',
        description: 'Prepare for and recover from disruptive incidents.',
        icon: <Activity className="h-8 w-8" />,
        color: 'text-amber-400',
        goal: 'Ensure your business can survive and recover from disasters.',
        primaryActionLink: '/business-continuity',
        infographicSteps: [
            {
                title: 'Foundation & Scope',
                description: 'Define policy, scope, and conduct gap analysis.',
                link: '/gap-analysis',
                details: 'Establish your Business Continuity Policy and define the scope of your BCMS. Understand your organization\'s context and stakeholder requirements (ISO 22301 Clause 4).'
            },
            {
                title: 'BIA & Risk Assessment',
                description: 'Identify critical activities, RTO/RPO, and assess risks.',
                link: '/clients/select/business-continuity/bia',
                details: 'Perform Business Impact Analysis (BIA) to identify critical functions and set RTO/RPO (Clause 8.2.2). Assess risks that could disrupt these functions (Clause 8.2.3).'
            },
            {
                title: 'Strategies & Plans',
                description: 'Select recovery strategies and document business continuity plans.',
                link: '/clients/select/business-continuity/plans',
                details: 'Determine strategies to meet recovery times (e.g., alternate sites, backups). Document specific Business Continuity Plans (BCP) and incident response procedures (Clause 8.4).'
            },
            {
                title: 'Exercises & Testing',
                description: 'Train staff and validate plans through simulations.',
                link: '/clients/select/business-continuity/exercises',
                details: 'Verify your plans work through tabletop exercises or simulations (Clause 8.5). Train staff on their roles during a disruption to ensure competence (Clause 7.2).'
            },
            {
                title: 'Audit & Certification',
                description: 'Internal audit, management review, and external certification.',
                link: '/audit-readiness',
                details: 'Review the BCMS through internal audits (Clause 9.2) and management review (Clause 9.3). Proceed to external Stage 1 and Stage 2 certification audits.'
            }
        ]
    },
    {
        id: 'business-impact-analysis',
        title: 'Business Impact Analysis',
        description: 'Quantify the impact of disruptions and define recovery objectives.',
        icon: <BarChart3 className="h-8 w-8" />,
        color: 'text-orange-400',
        goal: 'Identify critical processes and set RTO/RPO targets.',
        primaryActionLink: '/clients/select/business-continuity/bia',
        infographicSteps: [
            {
                title: 'Scope & Methodology',
                description: 'Define organizational scope and impact criteria.',
                link: '/clients/select/business-continuity/bia',
                details: 'Define the boundaries of your BIA (e.g., specific departments, locations). Establish the criteria for evaluating impact (financial, operational, legal, reputational) over time.'
            },
            {
                title: 'Critical Processes',
                description: 'Identify and map key business functions.',
                link: '/clients/select/business-continuity/bia',
                details: 'Catalog all business activities. Identify which ones are critical to your mission and understanding their dependencies (upstream inputs and downstream outputs).'
            },
            {
                title: 'Impact Assessment',
                description: 'Evaluate consequences of disruption over time.',
                link: '/clients/select/business-continuity/bia',
                details: 'Assess what happens if a process stops for 1 hour, 1 day, 1 week, etc. Quantify the losses (e.g., revenue loss per hour) and qualitative impacts (e.g., customer churn).'
            },
            {
                title: 'Dependencies & Resources',
                description: 'Map required applications, vendors, and staff.',
                link: '/clients/select/business-continuity/bia',
                details: 'Determine exactly what each process needs to operate: specific IT systems (SaaS, servers), key vendors/suppliers, key personnel, and physical workspace requirements.'
            },
            {
                title: 'RTO & RPO Definition',
                description: 'Set Recovery Time and Recovery Point Objectives.',
                link: '/clients/select/business-continuity/bia',
                details: 'Based on the impact assessment, set the Maximum Acceptable Outage (MAO). Then define the Recovery Time Objective (RTO) and Recovery Point Objective (RPO) for each critical activity.'
            }
        ]
    },
    {
        id: 'vendor-risk',
        title: 'Vendor Risk Management',
        description: 'Assess and monitor third-party security risks.',
        icon: <Building2 className="h-8 w-8" />,
        color: 'text-indigo-400',
        goal: 'Secure your supply chain.',
        primaryActionLink: '/clients/select/risk/vendors',
        infographicSteps: [
            {
                title: 'Vendor Inventory',
                description: 'Catalog all third-party suppliers.',
                link: '/clients/select/risk/vendors',
                details: 'Create a central register of all third-party vendors, suppliers, and contractors. Identify who owns the relationship and what data they access.'
            },
            {
                title: 'Classification',
                description: 'Rate critical vs. non-critical vendors.',
                link: '/clients/select/risk/vendors',
                details: 'Categorize vendors based on risk (e.g., Critical, High, Medium, Low). Focus your deepest assessments on those with access to sensitive data (Clause 15.1).'
            },
            {
                title: 'Assessment',
                description: 'Send security questionnaires (SIG/CAIQ).',
                link: '/clients/select/risk/vendors',
                details: 'Send security questionnaires to understand their controls. Request evidence of certifications (ISO 27001, SOC 2) to validate their security posture.'
            },
            {
                title: 'Review & Approval',
                description: 'Evaluate risks and sign contracts.',
                link: '/clients/select/risk/vendors',
                details: 'Review assessment responses and identify gaps. Ensure security requirements and right-to-audit clauses are included in the final contract.'
            },
            {
                title: 'Monitoring',
                description: 'Continuous performance review.',
                link: '/clients/select/risk/vendors',
                details: 'Regularly re-assess critical vendors. Monitor for security incidents or changes in service delivery that could impact your compliance.'
            }
        ]
    },
    {
        id: 'incident-response',
        title: 'Incident Response',
        description: 'Detect, respond to, and recover from security incidents.',
        icon: <AlertTriangle className="h-8 w-8" />,
        color: 'text-pink-500',
        goal: 'Minimize damage and recovery time.',
        primaryActionLink: '/clients/select/incidents',
        infographicSteps: [
            {
                title: 'Preparation',
                description: 'Plan and train the team.',
                link: '/clients/select/incidents',
                details: 'Develop an Incident Response Plan (IRP). Define roles and responsibilities, set up communication channels, and ensure tools are ready.'
            },
            {
                title: 'Detection & Analysis',
                description: 'Identify and triage the incident.',
                link: '/clients/select/incidents',
                details: 'Monitor systems for anomalies. When an alert triggers, verify if it is a false positive or a true incident. Determine its severity and scope.'
            },
            {
                title: 'Containment',
                description: 'Stop the bleeding.',
                link: '/clients/select/incidents',
                details: 'Isolate affected systems to prevent spread (Short-term). Apply fixes to patch the vulnerability (Long-term) while keeping evidence intact for forensics.'
            },
            {
                title: 'Eradication & Recovery',
                description: 'Remove malware and restore data.',
                link: '/clients/select/incidents',
                details: 'Remove the root cause (e.g., delete malware, disable accounts). Restore systems from clean backups and verify they are functioning normally.'
            },
            {
                title: 'Post-Incident',
                description: 'Lessons learned and policy updates.',
                link: '/clients/select/incidents',
                details: 'Conduct a retrospective to discuss what went well and what didn\'t. Update the IRP and security controls to prevent recurrence (Clause 16).'
            }
        ]
    },
    {
        id: 'policy-lifecycle',
        title: 'Policy Lifecycle',
        description: 'Manage the creation and review of security policies.',
        icon: <FileText className="h-8 w-8" />,
        color: 'text-cyan-400',
        goal: 'Maintain up-to-date governance.',
        primaryActionLink: '/client-policies',
        infographicSteps: [
            {
                title: 'Drafting',
                description: 'Create policy content.',
                link: '/client-policies',
                details: 'Write clear, concise policies addressing specific security requirements (e.g., Access Control, Data Protection). Align them with ISO 27001 Clause 5.2.'
            },
            {
                title: 'Stakeholder Review',
                description: 'Get input from department heads.',
                link: '/client-policies',
                details: 'Circulate drafts to key stakeholders (IT, HR, Legal). Ensure the policy is practical and does not conflict with business operations.'
            },
            {
                title: 'Approval',
                description: 'Formal management sign-off.',
                link: '/client-policies',
                details: 'Obtain formal approval from Top Management (CISO, CEO, or Steering Committee). This demonstrates leadership commitment.'
            },
            {
                title: 'Distribution',
                description: 'Publish and track acknowledgment.',
                link: '/client-policies',
                details: 'Publish the policy in a central repository. Require all employees to read and acknowledge it to ensure awareness (Clause 7.3).'
            },
            {
                title: 'Annual Review',
                description: 'Update for new threats.',
                link: '/client-policies',
                details: 'Review policies at least annually or upon significant changes. Update them to reflect new technologies, threats, or business processes.'
            }
        ]
    }
];

import { useClientContext } from '@/contexts/ClientContext';

export default function StartHere() {
    const [, setLocation] = useLocation();
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const utils = trpc.useUtils();
    const { selectedClientId } = useClientContext();

    // Mutation to mark tour as seen
    const completeTourMutation = trpc.users.completeTour.useMutation({
        onSuccess: () => {
            utils.users.me.invalidate();
        }
    });

    const handleSkip = () => {
        try {
            console.log('Skip to Dashboard clicked');
            // Redirect immediately
            setLocation('/dashboard');

            // Try to mark tour as seen in the background
            completeTourMutation.mutate(undefined, {
                onSuccess: () => {
                    console.log('Tour marked as seen successfully');
                    toast.success("You're all set!");
                },
                onError: (error) => {
                    console.error('Failed to complete tour:', error);
                    // Don't show error toast since user is already redirected
                }
            });
        } catch (error) {
            console.error('Error in handleSkip:', error);
            // If setLocation fails, the anchor tag href will still work
        }
    };

    const handleNavigate = (path: string) => {
        // Resolve 'select' to actual client ID if possible
        let target = path;

        if (target.includes('/clients/select/')) {
            if (selectedClientId) {
                target = target.replace('/clients/select', `/clients/${selectedClientId}`);
            } else {
                // If no client selected, we can't deep link to a specific module easily.
                // Best fallback is the client list, or we could just try to go to the alias 
                // and let the alias handle it (but we know /risks/assets isn't aliased).

                // For now, redirect to /clients if we can't resolve the specific deep link
                toast.error("Please select a workspace first.");
                setLocation('/clients');
                return;
            }
        }

        // Mark as seen when they actually start working
        // Redirect immediately first
        setLocation(target);

        // Try to mark tour as seen in the background
        completeTourMutation.mutate(undefined, {
            onSuccess: () => {
                console.log('Tour marked as seen successfully');
            },
            onError: (error) => {
                console.error('Failed to complete tour:', error);
                // User is already redirected, so just log the error
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#001e2b] text-white p-8 relative overflow-hidden">
            {/* Background ambient glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="flex justify-between items-center mb-16">
                    <div>
                        <h1 className="text-5xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4 tracking-tight">
                            Start Here
                        </h1>
                        <p className="text-slate-400 text-lg font-medium">
                            Choose a workflow to begin your compliance journey.
                        </p>
                    </div>
                    <a
                        href="/dashboard"
                        onClick={(e) => {
                            e.preventDefault();
                            handleSkip();
                        }}
                        className="inline-flex items-center px-5 py-2.5 text-slate-300 hover:text-white bg-[#002a40]/50 hover:bg-[#003554]/80 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-sm transition-all duration-300 cursor-pointer font-semibold group hover:shadow-cyan-500/10"
                    >
                        Skip to Dashboard <LayoutDashboard className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                </header>

                {!selectedWorkflow ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-700">
                        {WORKFLOWS.map((workflow) => (
                            <Card
                                key={workflow.id}
                                className="bg-[#002a40]/40 backdrop-blur-xl border border-slate-700/50 hover:border-emerald-500/50 shadow-lg hover:shadow-emerald-500/10 rounded-3xl transition-all duration-500 cursor-pointer group hover:-translate-y-1 relative overflow-hidden"
                                onClick={() => setSelectedWorkflow(workflow)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardHeader className="p-8 relative z-10">
                                    <div className={`p-4 rounded-2xl bg-slate-900/50 backdrop-blur-md w-fit mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner border border-slate-700/50 ${workflow.color}`}>
                                        {workflow.icon}
                                    </div>
                                    <CardTitle className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors tracking-tight mb-2">
                                        {workflow.title}
                                    </CardTitle>
                                    <CardDescription className="text-slate-400 font-medium leading-relaxed">
                                        {workflow.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter className="px-8 pb-8 relative z-10">
                                    <div className="flex items-center text-sm font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0">
                                        View Workflow <ArrowRight className="ml-2 h-4 w-4" />
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-bottom-8 duration-500">
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedWorkflow(null)}
                            className="mb-8 text-slate-400 hover:text-white"
                        >
                            ← Back to Workflows
                        </Button>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Infographic / Steps Column */}
                            <div className="lg:col-span-2 space-y-8 animate-in slide-in-from-left-8 duration-500">
                                <div className="bg-[#002a40]/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/10 to-transparent blur-3xl pointer-events-none" />

                                    <div className="flex items-center gap-6 mb-12 relative z-10">
                                        <div className={`p-5 rounded-2xl bg-slate-900/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-slate-700/50 ${selectedWorkflow.color}`}>
                                            {selectedWorkflow.icon}
                                        </div>
                                        <div>
                                            <h2 className="text-4xl font-black text-white tracking-tight">{selectedWorkflow.title}</h2>
                                            <p className="text-emerald-400 font-semibold mt-2 text-lg">{selectedWorkflow.goal}</p>
                                        </div>
                                    </div>

                                    {/* Infographic Visualization */}
                                    <div className="relative py-4 pl-4 z-10">
                                        {/* Connector Line */}
                                        <div className="absolute left-[39px] top-6 bottom-6 w-1 bg-gradient-to-b from-emerald-500/50 via-cyan-500/30 to-slate-700/50 rounded-full z-0" />

                                        <div className="space-y-10 relative z-10">
                                            <TooltipProvider>
                                                {selectedWorkflow.infographicSteps.map((step, index) => (
                                                    <Tooltip key={index} delayDuration={200}>
                                                        <TooltipTrigger asChild>
                                                            <div
                                                                className="flex gap-8 group cursor-help outline-none"
                                                                tabIndex={0}
                                                            >
                                                                {/* Step Number Bubble */}
                                                                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-[#001e2b] border-2 border-slate-700 group-hover:border-emerald-500 flex items-center justify-center text-xl font-black text-slate-400 group-hover:text-white transition-all duration-300 shadow-xl group-hover:shadow-emerald-500/20 group-hover:scale-110">
                                                                    {index + 1}
                                                                </div>

                                                                {/* Content */}
                                                                <div className="flex-1 bg-[#001e2b]/60 backdrop-blur-md p-7 rounded-2xl border border-slate-700/50 group-hover:border-emerald-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 group-hover:-translate-y-1">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <h3 className="text-2xl font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">{step.title}</h3>
                                                                    </div>
                                                                    <p className="text-slate-400 mb-6 leading-relaxed font-medium">{step.description}</p>
                                                                    <div className="flex items-center">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="bg-[#002a40]/50 text-slate-300 border-slate-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 transition-all font-semibold"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleNavigate(step.link);
                                                                            }}
                                                                        >
                                                                            Go to {step.title} &rarr;
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TooltipTrigger>
                                                        {step.details && (
                                                            <TooltipContent
                                                                side="right"
                                                                align="center"
                                                                className="max-w-md bg-[#001e2b] border border-slate-700 shadow-2xl z-[100] rounded-2xl overflow-hidden p-0"
                                                                sideOffset={20}
                                                            >
                                                                <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                                        <Info className="h-4 w-4" />
                                                                    </div>
                                                                    <p className="font-bold text-emerald-400 text-lg tracking-tight">{step.title}</p>
                                                                </div>
                                                                <div className="p-5">
                                                                    <p className="leading-relaxed text-sm text-slate-300 font-medium">{step.details}</p>
                                                                </div>
                                                            </TooltipContent>
                                                        )}
                                                    </Tooltip>
                                                ))}
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar / Summary */}
                            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                                <Card className="bg-[#002a40]/40 backdrop-blur-2xl border border-slate-700/50 sticky top-8 rounded-3xl shadow-2xl overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                                    <CardHeader className="pb-4 relative z-10">
                                        <CardTitle className="text-2xl font-bold text-white tracking-tight">Workflow Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6 relative z-10">
                                        <p className="text-slate-300 text-base leading-relaxed font-medium">
                                            {selectedWorkflow.description}
                                        </p>
                                        <div className="pt-6 border-t border-slate-700/50">
                                            <h4 className="text-sm font-bold text-white mb-4 flex items-center uppercase tracking-wider">
                                                <BookOpen className="h-4 w-4 mr-2 text-cyan-400" />
                                                What you'll need
                                            </h4>
                                            <ul className="text-sm text-slate-400 space-y-3 font-medium">
                                                <li className="flex items-start">
                                                    <CheckCircle2 className="h-4 w-4 mr-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                    Access to company policies
                                                </li>
                                                <li className="flex items-start">
                                                    <CheckCircle2 className="h-4 w-4 mr-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                    Understanding of internal processes
                                                </li>
                                                <li className="flex items-start">
                                                    <CheckCircle2 className="h-4 w-4 mr-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                    Stakeholder contact information
                                                </li>
                                            </ul>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-6 pb-8 px-6 border-t border-slate-700/50 relative z-10 bg-slate-900/30">
                                        <Button
                                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-xl shadow-emerald-500/20 rounded-xl h-14 text-lg font-bold transition-all hover:scale-[1.02] border-0"
                                            size="lg"
                                            onClick={() => handleNavigate(selectedWorkflow.primaryActionLink)}
                                        >
                                            Start Workflow <PlayCircle className="ml-2 h-5 w-5" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
