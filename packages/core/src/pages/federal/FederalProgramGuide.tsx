import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { Button } from '@complianceos/ui/ui/button';
import {
    CheckCircle2, Lock, ArrowRight, BookOpen, ArrowLeft,
    Shield, Cloud, Clock, DollarSign, GitMerge, AlertTriangle, Award
} from 'lucide-react';

// ─── Framework Data ───────────────────────────────────────────────────────────

const FRAMEWORKS = {
    nist: {
        id: 'nist',
        label: 'NIST 800-171',
        shortLabel: 'NIST 800-171',
        subtitle: 'Protect Controlled Unclassified Information (CUI)',
        icon: Lock,
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-800',
        accent: 'from-blue-600 to-cyan-600',
        tabActive: 'bg-blue-600 text-white',
        tabInactive: 'text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100',
        overview: `NIST SP 800-171 outlines 110 security controls across 14 families to protect Controlled Unclassified Information (CUI) in non-federal systems and organizations. It is the foundational framework for the others — start here if your organization handles CUI. Compliance is self-attested but may require third-party validation for DoD contracts.`,
        highlightNote: `📌 Start here — NIST 800-171 is the foundation for both CMMC and FedRAMP Moderate. Expect 6–12 months for initial compliance.`,
        timeline: '6 – 12 months',
        cost: 'Variable (self-assessment)',
        steps: [
            {
                step: 1,
                title: 'Understand Requirements',
                subtitle: 'Scope & Team',
                description: 'Familiarize yourself with the 110 controls across 14 families (e.g., access control, incident response). Assign a compliance lead and involve IT, legal, and HR teams.',
                accent: 'from-blue-600 to-cyan-600',
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                keyActions: [
                    'Review official NIST SP 800-171 documentation.',
                    'Assign a dedicated compliance lead.',
                    'Form a cross-functional team: IT, legal, HR.',
                ],
            },
            {
                step: 2,
                title: 'Scope Your Environment',
                subtitle: 'CUI Boundary',
                description: 'Identify all systems that touch CUI and define clear boundaries. Exclude non-CUI systems to minimize scope and cost.',
                accent: 'from-indigo-600 to-blue-600',
                color: 'text-indigo-600',
                bg: 'bg-indigo-50',
                keyActions: [
                    'Conduct an inventory of assets, data flows, and users.',
                    'Define CUI boundaries and document data flows.',
                    'Isolate in-scope systems using network segmentation.',
                ],
            },
            {
                step: 3,
                title: 'Perform Gap Analysis',
                subtitle: 'Assess Current State',
                description: 'Assess your current controls against all 110 NIST 800-171 requirements. Prioritize gaps in high-risk areas like access control and risk assessment.',
                accent: 'from-violet-600 to-indigo-600',
                color: 'text-violet-600',
                bg: 'bg-violet-50',
                keyActions: [
                    'Use self-assessment tools or engage a consultant.',
                    'Prioritize gaps in Access Control, Incident Response, and Risk Assessment.',
                    'Score each control: Implemented, Partially Implemented, or Not Implemented.',
                ],
            },
            {
                step: 4,
                title: 'Develop System Security Plan (SSP)',
                subtitle: 'Document Controls',
                description: 'Create a comprehensive SSP outlining how each control is implemented, including system diagrams, responsibilities, and legal/policy references.',
                accent: 'from-purple-600 to-violet-600',
                color: 'text-purple-600',
                bg: 'bg-purple-50',
                keyActions: [
                    'Document all 110 controls with implementation statements.',
                    'Include boundary diagrams and data flow maps.',
                    'Define roles and responsibilities for each control family.',
                ],
            },
            {
                step: 5,
                title: 'Implement Controls',
                subtitle: 'Close the Gaps',
                description: 'Roll out technical and administrative controls to address identified gaps. Prioritize multi-factor authentication, encryption, and access logging.',
                accent: 'from-amber-500 to-orange-500',
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                keyActions: [
                    'Deploy MFA across all CUI-touching systems.',
                    'Implement encryption at rest and in transit.',
                    'Conduct staff security awareness training.',
                ],
            },
            {
                step: 6,
                title: 'Conduct Self-Assessment',
                subtitle: 'Validate Implementation',
                description: 'Validate your implementation against NIST 800-171A assessment guidelines. Score each control and document evidence.',
                accent: 'from-rose-500 to-red-500',
                color: 'text-rose-600',
                bg: 'bg-rose-50',
                keyActions: [
                    'Score controls using the NIST 800-171A methodology.',
                    'Collect and organize evidence for each control.',
                    'Calculate your overall assessment score.',
                ],
            },
            {
                step: 7,
                title: 'Remediate & Monitor',
                subtitle: 'Fix & Track',
                description: 'Develop a Plan of Action and Milestones (POA&M) for any remaining gaps. Implement continuous monitoring for ongoing compliance.',
                accent: 'from-emerald-500 to-teal-500',
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                keyActions: [
                    'Create a POA&M with owners and target dates for each gap.',
                    'Prioritize remediation by risk severity.',
                    'Implement automated monitoring and alerting.',
                ],
            },
            {
                step: 8,
                title: 'Attest Compliance',
                subtitle: 'Submit Assessment',
                description: 'Submit your self-assessment score to SPRS (Supplier Performance Risk System) if required for DoD contracts. Prepare documentation for potential audits.',
                accent: 'from-teal-500 to-cyan-500',
                color: 'text-teal-600',
                bg: 'bg-teal-50',
                keyActions: [
                    'Upload your assessment score to SPRS.',
                    'Maintain copies of your SSP and evidence package.',
                    'Prepare for potential third-party verification.',
                ],
            },
        ],
    },

    cmmc: {
        id: 'cmmc',
        label: 'CMMC',
        shortLabel: 'CMMC',
        subtitle: 'DoD Contractor Certification',
        icon: Shield,
        color: 'text-red-700',
        bg: 'bg-red-50',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-800',
        accent: 'from-red-600 to-rose-600',
        tabActive: 'bg-red-600 text-white',
        tabInactive: 'text-red-700 bg-red-50 border border-red-200 hover:bg-red-100',
        overview: `The Cybersecurity Maturity Model Certification (CMMC) is a DoD-specific certification that verifies implementation of cybersecurity controls for contractors handling CUI. It builds directly on NIST 800-171, with Levels 1–3. Level 2 (the most common for CUI) requires all 110 NIST 800-171 controls and often mandates a third-party C3PAO assessment.`,
        highlightNote: `📌 CMMC is built on NIST 800-171 — complete that first. Level 2 certification requires a C3PAO audit. Timeline: 9–18 months. Cost: $50K (self-assessed) to $200K+ (certification).`,
        timeline: '9 – 18 months',
        cost: '$50K – $200K+',
        steps: [
            {
                step: 1,
                title: 'Determine Your Level',
                subtitle: 'CMMC Level 1, 2, or 3',
                description: 'Identify the required CMMC maturity level based on your DoD contract type. Level 1 covers basic cyber hygiene (17 practices). Level 2 requires 110 NIST 800-171 controls and may need a C3PAO audit.',
                accent: 'from-red-600 to-rose-600',
                color: 'text-red-600',
                bg: 'bg-red-50',
                keyActions: [
                    'Review your DoD solicitations for CMMC level requirements.',
                    'Level 1: Self-attestation. Level 2: May require C3PAO audit.',
                    'Level 3: Government-led assessment for advanced CUI.',
                ],
            },
            {
                step: 2,
                title: 'Scope Assets & Data',
                subtitle: 'Define CUI Boundary',
                description: 'Define the boundary for all assets, networks, and personnel that touch CUI. Proper scoping reduces certification cost and complexity.',
                accent: 'from-rose-600 to-pink-600',
                color: 'text-rose-600',
                bg: 'bg-rose-50',
                keyActions: [
                    'Inventory all systems, networks, and data in scope.',
                    'Use CMMC scoping guides to isolate CUI environments.',
                    'Consider network segmentation to reduce scope.',
                ],
            },
            {
                step: 3,
                title: 'Gap Analysis',
                subtitle: 'Compare Against CMMC Controls',
                description: 'Assess your current security posture against all applicable CMMC controls. Identify partial or missing implementations across all 14 control families.',
                accent: 'from-pink-600 to-fuchsia-600',
                color: 'text-pink-600',
                bg: 'bg-pink-50',
                keyActions: [
                    'Use CMMC assessment guides and scoring worksheets.',
                    'Identify controls that are partially vs. fully implemented.',
                    'Leverage NIST 800-171 gap work already completed.',
                ],
            },
            {
                step: 4,
                title: 'Develop SSP & Documentation',
                subtitle: 'Document Security Posture',
                description: 'Expand or develop your System Security Plan (SSP) for CMMC. Include a POA&M for any outstanding gaps and ensure all policies are documented.',
                accent: 'from-fuchsia-600 to-violet-600',
                color: 'text-fuchsia-600',
                bg: 'bg-fuchsia-50',
                keyActions: [
                    'Expand NIST 800-171 SSP to cover CMMC-specific practices.',
                    'Create a formal POA&M for all identified gaps.',
                    'Ensure all security policies and procedures are written and approved.',
                ],
            },
            {
                step: 5,
                title: 'Implement & Remediate',
                subtitle: 'Close Gaps',
                description: 'Apply all required technical and administrative controls. Deploy tools for monitoring, access management, and incident response. Train all employees.',
                accent: 'from-violet-600 to-purple-600',
                color: 'text-violet-600',
                bg: 'bg-violet-50',
                keyActions: [
                    'Deploy EDR, SIEM, and MFA solutions.',
                    'Conduct mandatory cybersecurity awareness training.',
                    'Complete all POA&M remediation actions.',
                ],
            },
            {
                step: 6,
                title: 'Self-Assessment or Audit Prep',
                subtitle: 'Validate Readiness',
                description: 'For Level 2 self-attestation, conduct an internal assessment and score all controls. For C3PAO certification, engage an assessor and prepare your evidence package.',
                accent: 'from-amber-500 to-orange-500',
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                keyActions: [
                    'Score all controls internally against CMMC assessment objectives.',
                    'Organize evidence packages: policies, logs, screenshots, configurations.',
                    'Engage a C3PAO early for Level 2 certification planning.',
                ],
            },
            {
                step: 7,
                title: 'Undergo C3PAO Assessment',
                subtitle: 'Certification Audit',
                description: 'Submit to a CMMC Third-Party Assessment Organization (C3PAO) for formal review. Address any findings before the assessment is finalized.',
                accent: 'from-orange-500 to-red-500',
                color: 'text-orange-600',
                bg: 'bg-orange-50',
                keyActions: [
                    'Select an accredited C3PAO from the CMMC-AB Marketplace.',
                    'Work with C3PAO to schedule and conduct the formal assessment.',
                    'Remediate any deficiencies identified during the assessment.',
                ],
            },
            {
                step: 8,
                title: 'Maintain & Report',
                subtitle: 'Ongoing Compliance',
                description: 'CMMC certification requires annual affirmations and recertification every 3 years. Maintain continuous monitoring and update your SSP as the system evolves.',
                accent: 'from-emerald-500 to-teal-500',
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                keyActions: [
                    'Submit annual affirmations via SPRS.',
                    'Maintain continuous monitoring programs.',
                    'Prepare for recertification every 3 years.',
                ],
            },
        ],
    },

    fedramp: {
        id: 'fedramp',
        label: 'FedRAMP',
        shortLabel: 'FedRAMP',
        subtitle: 'Cloud Services for Federal Agencies',
        icon: Cloud,
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-800',
        accent: 'from-emerald-600 to-teal-600',
        tabActive: 'bg-emerald-600 text-white',
        tabInactive: 'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100',
        overview: `FedRAMP standardizes security assessments and authorization for cloud services used by federal agencies. It uses NIST 800-53-based controls with baselines at Low, Moderate, or High impact levels. FedRAMP Moderate aligns closely with NIST 800-171, enabling control reuse. Authorization requires agency sponsorship or a Joint Authorization Board (JAB) review.`,
        highlightNote: `📌 FedRAMP is for cloud service providers (CSPs). Moderate baseline aligns with NIST 800-171 — leverage existing controls. Timeline: 12–24 months. Initial cost: $500K–$2M+.`,
        timeline: '12 – 24 months',
        cost: '$500K – $2M+',
        steps: [
            {
                step: 1,
                title: 'Determine Impact Level',
                subtitle: 'Low, Moderate, or High',
                description: 'Classify your cloud service based on the sensitivity of federal data it processes. Use FIPS 199 to determine impact. Moderate is the most common and aligns with NIST 800-171.',
                accent: 'from-emerald-600 to-teal-600',
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                keyActions: [
                    'Apply FIPS 199 categorization to your service.',
                    'Confirmmoderate or high based on agency data sensitivity.',
                    'Review the FedRAMP baselines for control count differences.',
                ],
            },
            {
                step: 2,
                title: 'Readiness Assessment',
                subtitle: 'Evaluate Preparedness',
                description: 'Conduct an internal gap analysis against FedRAMP baselines. Secure an agency sponsor or begin JAB engagement. A FedRAMP Readiness Assessment Report (RAR) is recommended.',
                accent: 'from-teal-600 to-cyan-600',
                color: 'text-teal-600',
                bg: 'bg-teal-50',
                keyActions: [
                    'Identify a federal agency sponsor willing to authorize your service.',
                    'Conduct an internal gap analysis against the applicable baseline.',
                    'Engage a 3PAO early to perform a readiness assessment (RAR).',
                ],
            },
            {
                step: 3,
                title: 'Develop SSP & Documentation',
                subtitle: 'Detail Security Posture',
                description: 'Create a comprehensive SSP, POA&M, and all required policy documents. Map every control to the NIST 800-53 baseline. Include detailed system architecture diagrams.',
                accent: 'from-cyan-600 to-sky-600',
                color: 'text-cyan-600',
                bg: 'bg-cyan-50',
                keyActions: [
                    'Write implementation statements for all baseline controls.',
                    'Develop required artifacts: SSP, PIA, AIA, CIS, CRM.',
                    'Create detailed architecture diagrams showing data flows and boundaries.',
                ],
            },
            {
                step: 4,
                title: 'Implement Controls',
                subtitle: 'Build a Compliant System',
                description: 'Apply NIST 800-53-based controls and focus on automation for continuous monitoring. Leverage existing NIST 800-171 or CMMC controls where they overlap.',
                accent: 'from-sky-600 to-blue-600',
                color: 'text-sky-600',
                bg: 'bg-sky-50',
                keyActions: [
                    'Implement all required technical controls systematically.',
                    'Prioritize automation for vulnerability scanning and log management.',
                    'Reuse NIST 800-171 control implementations where applicable.',
                ],
            },
            {
                step: 5,
                title: 'Engage a 3PAO',
                subtitle: 'Independent Assessment',
                description: 'Select an accredited Third-Party Assessment Organization (3PAO) to perform an independent assessment. The 3PAO conducts testing and reviews your evidence.',
                accent: 'from-blue-600 to-indigo-600',
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                keyActions: [
                    'Select an accredited 3PAO from the FedRAMP Marketplace.',
                    'Work with 3PAO to develop the Security Assessment Plan (SAP).',
                    'Undergo testing including vulnerability scanning, penetration testing, and control interview.',
                ],
            },
            {
                step: 6,
                title: 'Submit for Authorization',
                subtitle: 'Seek ATO',
                description: 'Package all documentation and submit to your agency sponsor or JAB for Authority to Operate (ATO) review. Address any findings from the review.',
                accent: 'from-indigo-600 to-violet-600',
                color: 'text-indigo-600',
                bg: 'bg-indigo-50',
                keyActions: [
                    'Compile the full authorization package: SSP, SAP, SAR, POA&M.',
                    'Submit to agency AO or JAB for review.',
                    'Respond to questions and address reviewer findings promptly.',
                ],
            },
            {
                step: 7,
                title: 'Achieve ATO',
                subtitle: 'Authorization to Operate',
                description: 'Receive your Authority to Operate from the agency or JAB. Get listed on the FedRAMP Marketplace, enabling other federal agencies to reuse your authorization.',
                accent: 'from-violet-600 to-purple-600',
                color: 'text-violet-600',
                bg: 'bg-violet-50',
                keyActions: [
                    'Receive the signed ATO letter from the Authorizing Official (AO).',
                    'Get listed on the FedRAMP Marketplace.',
                    'Brief agency ISSO and ISSM on ongoing monitoring obligations.',
                ],
            },
            {
                step: 8,
                title: 'Continuous Monitoring',
                subtitle: 'Maintain Authorization',
                description: 'FedRAMP requires ongoing monthly security reporting, annual assessments, and change management via ConMon. Failure to report can result in ATO revocation.',
                accent: 'from-purple-600 to-rose-600',
                color: 'text-purple-600',
                bg: 'bg-purple-50',
                keyActions: [
                    'Submit monthly vulnerability and POA&M reports to the agency.',
                    'Undergo annual 3PAO assessments.',
                    'Process significant changes through the FedRAMP Change Management process.',
                ],
            },
        ],
    },
};

const OVERLAP_NOTES = [
    {
        icon: GitMerge,
        title: 'NIST 800-171 → CMMC',
        desc: 'CMMC Level 2 is built directly on NIST 800-171. Complete NIST first — all 110 controls carry over.',
        color: 'text-blue-600',
        bg: 'bg-blue-50 border-blue-200',
    },
    {
        icon: GitMerge,
        title: 'NIST 800-171 → FedRAMP Moderate',
        desc: 'FedRAMP Moderate aligns closely with NIST 800-171. Reuse your SSP and control implementations.',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50 border-emerald-200',
    },
    {
        icon: GitMerge,
        title: 'CMMC + FedRAMP Overlap',
        desc: 'If both are required, start with FedRAMP (stricter) — it covers all CMMC Level 2 controls and more.',
        color: 'text-purple-600',
        bg: 'bg-purple-50 border-purple-200',
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function FederalProgramGuide() {
    const params = useParams();
    const clientId = parseInt(params.id || '0');
    const [active, setActive] = useState<'nist' | 'cmmc' | 'fedramp'>('nist');

    const fw = FRAMEWORKS[active];
    const FwIcon = fw.icon;

    return (
        <DashboardLayout>
            <div className="relative min-h-screen bg-slate-50 p-6 lg:p-10">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Back */}
                    <Link href={`/clients/${clientId}/federal/dashboard`}>
                        <Button variant="ghost" className="mb-2 text-slate-500 hover:text-slate-900">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Federal Hub
                        </Button>
                    </Link>

                    {/* Hero */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-700 mb-2 shadow-sm border border-slate-200">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                            Federal Compliance Guides
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                            Three step-by-step roadmaps for NIST 800-171, CMMC, and FedRAMP — choose the framework relevant to your contracts.
                        </p>
                    </div>

                    {/* Framework Selector */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {(Object.keys(FRAMEWORKS) as Array<keyof typeof FRAMEWORKS>).map(key => {
                            const f = FRAMEWORKS[key];
                            const Icon = f.icon;
                            const isActive = active === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActive(key)}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${isActive ? f.tabActive + ' shadow-md scale-105' : f.tabInactive}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {f.shortLabel}
                                </button>
                            );
                        })}
                    </div>

                    {/* Framework Header Card */}
                    <div className={`rounded-2xl border ${fw.border} ${fw.bg} p-6 flex flex-col sm:flex-row gap-5 items-start`}>
                        <div className={`p-4 rounded-xl bg-white shadow-sm border ${fw.border}`}>
                            <FwIcon className={`w-8 h-8 ${fw.color}`} />
                        </div>
                        <div className="flex-1 space-y-3">
                            <div className="flex flex-wrap gap-2 items-center">
                                <h2 className="text-2xl font-bold text-slate-900">{fw.label}</h2>
                                <Badge className={fw.badge}>{fw.subtitle}</Badge>
                            </div>
                            <p className="text-slate-700 leading-relaxed">{fw.overview}</p>
                            <div className="flex flex-wrap gap-4 pt-1">
                                <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span>Timeline: <strong>{fw.timeline}</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                                    <DollarSign className="w-4 h-4 text-slate-400" />
                                    <span>Est. Cost: <strong>{fw.cost}</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Highlight Note */}
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-amber-800 leading-relaxed font-medium">{fw.highlightNote}</p>
                    </div>

                    {/* Steps */}
                    <div className="space-y-10 relative pb-12">
                        <div className="absolute top-12 bottom-12 left-[31px] w-0.5 bg-slate-200 z-0 hidden sm:block" />

                        {fw.steps.map(step => (
                            <div key={step.step} className="relative z-10 flex flex-col sm:flex-row gap-6 lg:gap-8 group">
                                {/* Step Number */}
                                <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-md border-2 border-white ring-1 ring-slate-100 group-hover:ring-blue-200 transition-all duration-300">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${step.accent} text-white shadow-inner`}>
                                        <span className="font-black text-xl">{step.step}</span>
                                    </div>
                                </div>

                                {/* Card */}
                                <Card className="flex-grow border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader className={`${step.bg} border-b border-white rounded-t-xl`}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <Badge variant="outline" className={`mb-2 bg-white ${step.color} border-current text-xs font-bold uppercase tracking-wide`}>
                                                    Step {step.step}: {step.subtitle}
                                                </Badge>
                                                <CardTitle className="text-xl font-bold text-slate-900">
                                                    {step.title}
                                                </CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-5 space-y-5">
                                        <p className="text-slate-700 leading-relaxed">
                                            {step.description}
                                        </p>

                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-sm">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                Key Actions
                                            </h4>
                                            <ul className="space-y-2">
                                                {step.keyActions.map((action, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                                                        <span className="leading-relaxed">{action}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>

                    {/* Framework Overlap Section */}
                    <div className="border-t border-slate-200 pt-10 space-y-5">
                        <div className="flex items-center gap-2">
                            <GitMerge className="w-5 h-5 text-slate-500" />
                            <h3 className="text-xl font-bold text-slate-900">Framework Overlaps & Strategy</h3>
                        </div>
                        <p className="text-slate-600">
                            These frameworks share many controls. Plan your compliance journey strategically to maximize reuse and minimize costs.
                        </p>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {OVERLAP_NOTES.map((note, i) => {
                                const Icon = note.icon;
                                return (
                                    <div key={i} className={`p-4 rounded-xl border ${note.bg} space-y-2`}>
                                        <div className="flex items-center gap-2">
                                            <Icon className={`w-4 h-4 ${note.color}`} />
                                            <span className="font-semibold text-slate-900 text-sm">{note.title}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed">{note.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Other frameworks CTAs */}
                    <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Award className="w-5 h-5 text-amber-400" />
                            <span className="font-bold text-lg">Continue Your Compliance Journey</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {(Object.keys(FRAMEWORKS) as Array<keyof typeof FRAMEWORKS>)
                                .filter(k => k !== active)
                                .map(key => {
                                    const f = FRAMEWORKS[key];
                                    const Icon = f.icon;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => { setActive(key); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold transition-all"
                                        >
                                            <Icon className="w-4 h-4" />
                                            {f.label} Guide <ArrowRight className="w-3 h-3 ml-1" />
                                        </button>
                                    );
                                })}
                            <Link href={`/clients/${clientId}/federal/dashboard`}>
                                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold transition-all">
                                    Federal Dashboard <ArrowRight className="w-3 h-3 ml-1" />
                                </button>
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}
