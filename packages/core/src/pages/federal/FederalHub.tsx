
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Link, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
    FileText,
    ShieldCheck,
    ClipboardList,
    Zap,
    Lock,
    ScrollText,
    ArrowRight,
    Building2,
    CheckCircle2,
    BookOpen
} from "lucide-react";

export default function FederalHub() {
    const params = useParams();
    const clientId = Number(params.id);

    const modules = [
        {
            title: "FIPS 199 Categorization",
            description: "Categorize your system based on the impact to Confidentiality, Integrity, and Availability.",
            icon: Lock,
            path: `/clients/${clientId}/federal/fips-199`,
            category: "Categorization",
            status: "Required"
        },
        {
            title: "NIST 800-171 SSP",
            description: "System Security Plan (SSP) for CMMC Level 2 and NIST 800-171 compliance.",
            icon: FileText,
            path: `/clients/${clientId}/federal/ssp-171`,
            category: "System Security Plans",
            status: "In Progress"
        },
        {
            title: "NIST 800-172 SSP",
            description: "Enhanced security requirements for high-value assets and APT protection.",
            icon: ShieldCheck,
            path: `/clients/${clientId}/federal/ssp-172`,
            category: "System Security Plans",
            status: "Draft"
        },
        {
            title: "NIST 800-171 SAR",
            description: "Security Assessment Report (SAR) detailing the results of security control testing.",
            icon: ScrollText,
            path: `/clients/${clientId}/federal/sar-171`,
            category: "Security Assessments",
            status: "Ready"
        },
        {
            title: "NIST 800-172 SAR",
            description: "Enhanced SAR for advanced security requirements and specialized assessments.",
            icon: ClipboardList,
            path: `/clients/${clientId}/federal/sar-172`,
            category: "Security Assessments",
            status: "Ready"
        },
        {
            title: "Plan of Action & Milestones",
            description: "Standard DoD POA&M for tracking remediation of identified weaknesses.",
            icon: Zap,
            path: `/clients/${clientId}/federal/poam`,
            category: "Remediation",
            status: "Active"
        }
    ];

    const categories = ["Categorization", "System Security Plans", "Security Assessments", "Remediation"];

    return (
        <DashboardLayout>
            <div className="p-8 space-y-6 max-w-7xl mx-auto">
                <Breadcrumb items={[
                    { label: "Dashboard", href: `/clients/${clientId}/dashboard` },
                    { label: "Federal Compliance Hub" }
                ]} />

                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                            <Building2 className="h-10 w-10 text-blue-600" />
                            Federal Compliance Hub
                        </h1>
                        <p className="text-slate-500 text-lg">Manage your DFARS, NIST 800-171/172, and CMMC documentation requirements.</p>
                    </div>
                    <div className="flex gap-4">
                        <Link href={`/clients/${clientId}/workflows/nist-rmf`}>
                            <Button className="bg-slate-900 hover:bg-black font-bold h-12 px-6 gap-2 shadow-xl shadow-slate-200">
                                <Zap className="h-4 w-4 text-blue-400 fill-current" />
                                Start Guided RMF Journey
                            </Button>
                        </Link>
                        <div className="flex gap-3 h-12 items-center">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 px-4 py-1 font-bold">
                                DFARS 252.204-7012
                            </Badge>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 px-4 py-1 font-bold">
                                NIST SP 800-171 Rev 3 Ready
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Federal Overview Callout */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 mb-8">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex gap-4 items-center">
                            <div className="p-3 bg-blue-100 rounded-xl hidden sm:block">
                                <BookOpen className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-blue-900 text-lg">Federal Compliance Guidance</h3>
                                <p className="text-blue-700/80 max-w-2xl">
                                    New to Federal Compliance? View our comprehensive overview of DFARS 7012, NIST 800-171, and CMMC requirements to get started.
                                </p>
                            </div>
                        </div>
                        <Link href={`/clients/${clientId}/federal/overview`}>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold whitespace-nowrap">
                                View Guide <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mt-8">
                    <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl shadow-blue-100">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest opacity-80">Overall Readiness</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black">68%</span>
                                <span className="text-blue-200">Total Completion</span>
                            </div>
                            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                <div className="bg-white h-full" style={{ width: '68%' }} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Open Gaps</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-900">14</span>
                                <span className="text-slate-400">POA&M Items</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                                <CheckCircle2 className="h-4 w-4" />
                                4 items resolved this month
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Next Audit</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-900">42</span>
                                <span className="text-slate-400">Days Remaining</span>
                            </div>
                            <p className="text-slate-500 text-xs">CMMC Level 2 Certification Assessment</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm bg-[url('/grid.svg')]">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">System Impact</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-indigo-600">MOD</span>
                                <span className="text-slate-400">High Water Mark</span>
                            </div>
                            <p className="text-slate-500 text-xs">FIPS 199 Assessment: Moderate Impact</p>
                        </CardContent>
                    </Card>

                    {/* Compliance Guide Card */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between cursor-pointer hover:border-slate-400 hover:shadow-md transition-all group" onClick={() => window.location.href = `/clients/${clientId}/federal/alignment-guide`}>
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold text-slate-900">CMMC 2.0</span>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-slate-100 text-slate-700 pointer-events-none">GUIDE</Badge>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-2 font-medium group-hover:text-blue-600 transition-colors">
                                    <span>View alignment</span>
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 text-slate-600 group-hover:bg-slate-100 transition-colors">
                                <BookOpen className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {categories.map(category => (
                    <div key={category} className="space-y-4 pt-4">
                        <h2 className="text-xl font-bold text-slate-800 border-l-4 border-blue-600 pl-3">{category}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {modules.filter(m => m.category === category).map((module, idx) => (
                                <Link key={idx} href={module.path}>
                                    <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-slate-200 group">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                                    <module.icon className="h-6 w-6 text-slate-600 group-hover:text-blue-600" />
                                                </div>
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                                                    {module.status}
                                                </Badge>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">{module.title}</h3>
                                            <p className="text-sm text-slate-500 leading-relaxed">{module.description}</p>
                                            <div className="mt-6 flex items-center text-blue-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                Open Module <ArrowRight className="ml-2 h-4 w-4" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </DashboardLayout>
    );
}

