import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import {
    CheckCircle2, Shield, Lock, FileKey, Server, Users, BookOpen, Scale,
    Globe, Network, Database, Activity, LayoutDashboard, FileText, Cpu
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { cn } from '@/lib/utils';

export default function FederalAlignmentPage() {
    // No state needed for tabs as we use Radix Tabs

    const cmmcAreas = [
        {
            id: 'ac',
            title: 'Access Control',
            standard: 'CMMC 2.0 / NIST 800-171 3.1',
            icon: Lock,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            requirements: [
                'Limit information system access to authorized users',
                'Limit information system access to the types of transactions and functions',
                'Verify and control/limit connections to external information systems'
            ],
            implementation: [
                { feature: 'RBAC', detail: 'Role-based access control with granular permissions' },
                { feature: 'Session Management', detail: 'Configurable session timeouts and concurrent login limits' },
                { feature: 'MFA Enforcement', detail: 'Mandatory Multi-Factor Authentication for all users' }
            ]
        },
        {
            id: 'ia',
            title: 'Identification & Authentication',
            standard: 'CMMC 2.0 / NIST 800-171 3.5',
            icon: Users,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            requirements: [
                'Identify information system users',
                'Authenticate (verify) the identities of those users',
                'Enforce a minimum password complexity'
            ],
            implementation: [
                { feature: 'Identity Provider', detail: 'SAML/SSO integration support' },
                { feature: 'Authenticator Support', detail: 'TOTP, WebAuthn/FIDO2 support' },
                { feature: 'Password Policy', detail: 'Enforceable complexity and rotation policies' }
            ]
        },
        {
            id: 'sc',
            title: 'System & Comm Protection',
            standard: 'CMMC 2.0 / NIST 800-171 3.13',
            icon: Server,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            requirements: [
                'Monitor, control, and protect organizational communications',
                'Employ architectural designs',
                'Prevent unauthorized and unintended information transfer'
            ],
            implementation: [
                { feature: 'Encryption in Transit', detail: 'TLS 1.2+ mandatory for all connections' },
                { feature: 'Encryption at Rest', detail: 'AES-256 encryption for all stored CUI' },
                { feature: 'Separation', detail: 'Logical separation of client environments (Tenant isolation)' }
            ]
        },
        {
            id: 'au',
            title: 'Audit & Accountability',
            standard: 'CMMC 2.0 / NIST 800-171 3.3',
            icon: FileKey,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            requirements: [
                'Create and retain system audit logs and records',
                'Ensure the actions of individual system users can be uniquely traced',
                'Review and update logged events'
            ],
            implementation: [
                { feature: 'Immutable Logs', detail: 'Write-once read-many (WORM) audit trails' },
                { feature: 'Action Tracing', detail: 'Every API call logged with User ID, IP, and Timestamp' },
                { feature: 'Log Export', detail: 'SIEM integration capability for log aggregation' }
            ]
        }
    ];

    const fedrampAreas = [
        {
            id: 'ac',
            title: 'Access Control',
            standard: 'NIST 800-53 AC Family',
            icon: Lock,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            requirements: [
                'AC-2: Account Management - Automate account creation, modification, enabling, disabling, and removal',
                'AC-3: Access Enforcement - Enforce approved authorizations for logical access',
                'AC-6: Least Privilege - Employ the principle of least privilege'
            ],
            implementation: [
                { feature: 'Automated Provisioning', detail: 'SCIM support for user lifecycle management' },
                { feature: 'Policy Enforcement', detail: 'Prevent access for non-compliant devices or users' },
                { feature: 'Role Matrix', detail: 'Detailed entitlement reviews and reporting' }
            ]
        },
        {
            id: 'ia',
            title: 'Identification',
            standard: 'NIST 800-53 IA Family',
            icon: Users,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            requirements: [
                'IA-2: Identification and Authentication - Uniquely identify and authenticate organizational users',
                'IA-4: Identifier Management - Manage information system identifiers',
                'IA-5: Authenticator Management - Manage information system authenticators'
            ],
            implementation: [
                { feature: 'Centralized IdP', detail: 'Single source of truth for all identities' },
                { feature: 'Credential Vaulting', detail: 'Secure storage of keys and secrets' },
                { feature: 'MFA Logic', detail: 'Adaptive authentication challenges based on risk' }
            ]
        },
        {
            id: 'sc',
            title: 'System Protection',
            standard: 'NIST 800-53 SC Family',
            icon: Server,
            color: 'text-teal-600',
            bgColor: 'bg-teal-50',
            requirements: [
                'SC-8: Transmission Confidentiality and Integrity - Protect the confidentiality and integrity of transmitted information',
                'SC-13: Cryptographic Protection - Implement FIPS-validated cryptography',
                'SC-28: Protection of Information at Rest - Protect information at rest'
            ],
            implementation: [
                { feature: 'FIPS Mode', detail: 'Option to enforce FIPS 140-2 validated crypto modules' },
                { feature: 'Data Boundaries', detail: 'Geographic restriction of data processing and storage' },
                { feature: 'Key Management', detail: 'Customer-managed encryption keys (BYOK)' }
            ]
        },
        {
            id: 'au',
            title: 'Audit & Accountability',
            standard: 'NIST 800-53 AU Family',
            icon: FileKey,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            requirements: [
                'AU-2: Event Logging - Determine that the information system is capable of auditing',
                'AU-6: Audit Review, Analysis, and Reporting - Review and analyze information system audit records',
                'AU-11: Audit Record Retention - Retain audit records'
            ],
            implementation: [
                { feature: 'Retention Policies', detail: 'Automated retention enforcement (1 year+)' },
                { feature: 'Tamper-Evidence', detail: 'Cryptographic chaining of log entries' },
                { feature: 'Real-time Alerts', detail: 'Immediate notification of critical security events' }
            ]
        }
    ];

    const fismaAreas = [
        {
            id: 'cat',
            title: 'Categorization',
            standard: 'FIPS 199 / NIST 800-60',
            icon: LayoutDashboard,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            requirements: [
                'Categorize information and information systems based on impact analysis',
                'Determine security objectives for Confidentiality, Integrity, and Availability',
                'Select appropriate security control baseline (Low, Moderate, High)'
            ],
            implementation: [
                { feature: 'FIPS 199 Wizard', detail: 'Guided categorization workflow to determine system impact level' },
                { feature: 'Information Types', detail: 'Library of NIST 800-60 information types' },
                { feature: 'Baseline Selection', detail: 'Automatic control baseline selection based on impact' }
            ]
        },
        {
            id: 'inv',
            title: 'Inventory',
            standard: 'FISMA System Inventory',
            icon: Database,
            color: 'text-cyan-600',
            bgColor: 'bg-cyan-50',
            requirements: [
                'Maintain an inventory of major information systems',
                'Track system interconnections and dependencies',
                'Update inventory data at least annually'
            ],
            implementation: [
                { feature: 'System Registry', detail: 'Centralized database of all FISMA systems' },
                { feature: 'Asset Management', detail: 'Automated asset discovery and tracking' },
                { feature: 'Interconnection Map', detail: 'Visual mapping of system boundaries and connections' }
            ]
        }
    ];

    const rmfAreas = [
        {
            id: 'prep',
            title: 'Prepare',
            standard: 'NIST 800-37 Task P-1',
            icon: BookOpen,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            requirements: [
                'Identify key risk management roles',
                'Establish risk management strategy',
                'Identify common controls'
            ],
            implementation: [
                { feature: 'Role Assignment', detail: 'Assign ISO, ISSO, AO roles within the platform' },
                { feature: 'Strategy Doc', detail: 'Templates for risk management strategy' },
                { feature: 'Common Controls', detail: 'Inheritance model for common and hybrid controls' }
            ]
        },
        {
            id: 'mon',
            title: 'Monitor',
            standard: 'NIST 800-37 Task M-1',
            icon: Activity,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            requirements: [
                'Monitor security and privacy controls',
                'Assess control effectiveness',
                'Respond to risk'
            ],
            implementation: [
                { feature: 'Continuous Monitoring', detail: 'Real-time dashboard of control status' },
                { feature: 'Automated Tests', detail: 'Scheduled checks against technical baselines' },
                { feature: 'Risk Response', detail: 'Integrated workflow for remediating findings' }
            ]
        }
    ];

    const stigAreas = [
        {
            id: 'os',
            title: 'OS Hardening',
            standard: 'DISA STIGs',
            icon: Server,
            color: 'text-slate-700',
            bgColor: 'bg-slate-100',
            requirements: [
                'Apply secure configurations to Operating Systems',
                'Disable unnecessary services and ports',
                'Configure audit policies'
            ],
            implementation: [
                { feature: 'Checklist Import', detail: 'Import .ckl files directly from STIG Viewer' },
                { feature: 'Policy Templates', detail: 'Pre-built policies aligning with STIG requirements' },
                { feature: 'Drift Detection', detail: 'Alerts on configuration changes' }
            ]
        },
        {
            id: 'app',
            title: 'Application Security',
            standard: 'Application STIGs',
            icon: Globe,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            requirements: [
                'Secure web servers and databases',
                'Protect application code and libraries',
                'Enforce strong authentication for apps'
            ],
            implementation: [
                { feature: 'Vuln Scanning', detail: 'Integration with vulnerability scanners' },
                { feature: 'App Inventory', detail: 'Track software assets and versions' },
                { feature: 'Config Review', detail: 'Manual review checklists for app configurations' }
            ]
        }
    ];

    const fipsAreas = [
        {
            id: 'crypto',
            title: 'Cryptographic Modules',
            standard: 'FIPS 140-3',
            icon: Cpu,
            color: 'text-violet-600',
            bgColor: 'bg-violet-50',
            requirements: [
                'Use validated cryptographic modules',
                'Protect cryptographic keys',
                'Ensure correct module operation'
            ],
            implementation: [
                { feature: 'Module Tracking', detail: 'Database of used FIPS modules and cert numbers' },
                { feature: 'Asset Linking', detail: 'Link assets to specific crypto modules' },
                { feature: 'Validation Check', detail: 'Automated verification of certificate status' }
            ]
        }
    ];

    const frameworks = [
        { id: 'cmmc', label: 'CMMC 2.0', icon: Shield, areas: cmmcAreas },
        { id: 'fedramp', label: 'FedRAMP', icon: Globe, areas: fedrampAreas },
        { id: 'fisma', label: 'FISMA', icon: FileText, areas: fismaAreas },
        { id: 'rmf', label: 'RMF', icon: Activity, areas: rmfAreas },
        { id: 'stig', label: 'DISA STIGs', icon: Server, areas: stigAreas },
        { id: 'fips', label: 'FIPS 140-3', icon: Cpu, areas: fipsAreas },
    ];

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-6 lg:p-10">
                <div className="w-full space-y-8 px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 text-white mb-4">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                            Federal Compliance Alignment
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Comprehensive alignment with US Federal Cybersecurity Standards and Frameworks
                        </p>
                    </div>

                    {/* Framework Tabs */}
                    <Tabs defaultValue="cmmc" className="space-y-8">
                        <div className="flex justify-center">
                            <TabsList className="h-auto p-1 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl shadow-sm flex-wrap justify-center">
                                {frameworks.map(fw => (
                                    <TabsTrigger
                                        key={fw.id}
                                        value={fw.id}
                                        className="gap-2 px-6 py-3 text-sm font-medium data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-lg transition-all"
                                    >
                                        <fw.icon className="h-4 w-4" />
                                        {fw.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {frameworks.map(fw => (
                            <TabsContent key={fw.id} value={fw.id} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Framework Description Card */}
                                <Card className="border-2 border-slate-300 bg-white shadow-lg">
                                    <CardHeader className="bg-gradient-to-r from-slate-100 to-gray-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-slate-800 rounded-lg text-white">
                                                <fw.icon className="h-6 w-6" />
                                            </div>
                                            <CardTitle className="text-2xl">{fw.label} Alignment</CardTitle>
                                        </div>
                                        <CardDescription className="text-base">
                                            {fw.id === 'cmmc' && "Protecting CUI in non-federal systems. Aligns with NIST SP 800-171."}
                                            {fw.id === 'fedramp' && "Cloud security for federal agencies. Aligns with NIST SP 800-53."}
                                            {fw.id === 'fisma' && "Information security modernization for federal agencies. Aligns with FIPS 199/200."}
                                            {fw.id === 'rmf' && "Risk Management Framework. Aligns with NIST SP 800-37."}
                                            {fw.id === 'stig' && "Technical implementation guides for secure configuration. Aligns with DoD requirements."}
                                            {fw.id === 'fips' && "Security requirements for cryptographic modules. Aligns with FIPS 140-3."}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>

                                {/* Areas Tabs */}
                                <Tabs defaultValue={fw.areas[0].id} className="space-y-6">
                                    <TabsList className="grid grid-cols-2 lg:grid-cols-4 gap-2 h-auto bg-transparent p-0">
                                        {fw.areas.map((area) => (
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

                                    {fw.areas.map((area) => (
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
                                                            <Shield className="w-5 h-5 text-slate-700" />
                                                            Platform Implementation
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            {area.implementation.map((impl, idx) => (
                                                                <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
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
                            </TabsContent>
                        ))}
                    </Tabs>

                    {/* Strategic Value Card */}
                    <Card className="border-2 border-slate-300 bg-gradient-to-br from-slate-100 to-gray-200 shadow-lg mt-12">
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Scale className="w-6 h-6 text-slate-700" />
                                Strategic Value
                            </CardTitle>
                            <CardDescription>
                                Unified compliance across all federal standards
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            <Shield className="w-5 h-5 text-slate-700" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm mb-1">Certification Ready</h4>
                                            <p className="text-xs text-muted-foreground">Prepared for CMMC Assessment or FedRAMP Authorization</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            <FileKey className="w-5 h-5 text-slate-700" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm mb-1">Evidence Automation</h4>
                                            <p className="text-xs text-muted-foreground">Continuous gathering of artifacts for auditors</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            <Server className="w-5 h-5 text-slate-700" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm mb-1">Secure Architecture</h4>
                                            <p className="text-xs text-muted-foreground">Built on a foundation of zero trust principles</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            <Scale className="w-5 h-5 text-slate-700" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm mb-1">Rapid ATO</h4>
                                            <p className="text-xs text-muted-foreground">Accelerate Authority to Operate timelines significantly</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
