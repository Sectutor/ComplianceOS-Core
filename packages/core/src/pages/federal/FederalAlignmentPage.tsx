import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Badge } from '@complianceos/ui/ui/badge';
import { CheckCircle2, Shield, Lock, FileKey, Server, Users, BookOpen, Scale } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { cn } from '@/lib/utils';

export default function FederalAlignmentPage() {
    const [framework, setFramework] = useState<'cmmc' | 'fedramp'>('cmmc');

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

    const benefits = [
        { title: 'Certification Ready', description: 'Prepared for CMMC Assessment or FedRAMP Authorization', icon: Shield },
        { title: 'Evidence Automation', description: 'Continuous gathering of artifacts for auditors', icon: FileKey },
        { title: 'Secure Architecture', description: 'Built on a foundation of zero trust principles', icon: Server },
        { title: 'Rapid ATO', description: 'Accelerate Authority to Operate timelines significantly', icon: Scale }
    ];

    const currentAreas = framework === 'cmmc' ? cmmcAreas : fedrampAreas;

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-6 lg:p-10">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 text-white mb-4">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                            Federal Compliance
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Comprehensive alignment with US Federal Cybersecurity Standards
                        </p>

                        {/* Framework Toggle Tabs */}
                        <div className="flex justify-center">
                            <div className="inline-flex p-1 bg-slate-100 rounded-lg shadow-inner">
                                <button
                                    onClick={() => setFramework('cmmc')}
                                    className={cn(
                                        "px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200",
                                        framework === 'cmmc'
                                            ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                    )}
                                >
                                    CMMC 2.0 (Level 2)
                                </button>
                                <button
                                    onClick={() => setFramework('fedramp')}
                                    className={cn(
                                        "px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200",
                                        framework === 'fedramp'
                                            ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                    )}
                                >
                                    NIST 800-53 (FedRAMP)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Overview Card */}
                    <Card className="border-2 border-slate-300 bg-white shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-slate-100 to-gray-100">
                            <CardTitle className="text-2xl">
                                {framework === 'cmmc' ? 'Protecting CUI (Controlled Unclassified Information)' : 'Securing Federal Information Systems'}
                            </CardTitle>
                            <CardDescription className="text-base">
                                {framework === 'cmmc'
                                    ? "For organizations doing business with the DoD, protecting CUI is mandatory. Our platform implements the 110 controls of NIST SP 800-171 required for CMMC Level 2."
                                    : "FedRAMP authorization requires rigorous adherence to NIST SP 800-53 controls. Our platform provides the technical controls and evidence automation to support a Moderate baseline."
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-slate-100 rounded-lg">
                                    <div className="text-3xl font-bold text-slate-700">
                                        {framework === 'cmmc' ? '110' : '325+'}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Controls Covered</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-3xl font-bold text-green-600">Full</div>
                                    <div className="text-sm text-muted-foreground">Control Mapping</div>
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-3xl font-bold text-blue-600">SSP</div>
                                    <div className="text-sm text-muted-foreground">Auto-Generation</div>
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

                    {/* Benefits Section */}
                    <Card className="border-2 border-slate-300 bg-gradient-to-br from-slate-100 to-gray-200 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Scale className="w-6 h-6 text-slate-700" />
                                Strategic Value
                            </CardTitle>
                            <CardDescription>
                                Secure your path to government contracts with CMMC readiness
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {benefits.map((benefit, idx) => (
                                    <div key={idx} className="p-4 bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg">
                                                <benefit.icon className="w-5 h-5 text-slate-700" />
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
