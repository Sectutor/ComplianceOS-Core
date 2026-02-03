import React from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Shield, FileText, AlertTriangle, CheckCircle, ArrowRight, BookOpen, Layers, Lock, ScrollText, ClipboardList, Zap, Building2, TrendingUp, Calendar } from "lucide-react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

export default function FederalComplianceDashboard() {
    const params = useParams();
    const clientId = parseInt(params.id || "0");

    // Placeholder for real data fetching later
    // const { data: metrics } = trpc.federal.getDashboardMetrics.useQuery({ clientId });

    const workflowSteps = [
        {
            step: "1. Categorize",
            title: "FIPS 199",
            desc: "Define system impact levels.",
            link: `/clients/${clientId}/federal/fips-199`,
            icon: Lock,
            color: "text-blue-400",
            bg: "bg-blue-900/50",
            isComplete: true // Mock status
        },
        {
            step: "2. Plan",
            title: "SSP (800-171)",
            desc: "Document security controls.",
            link: `/clients/${clientId}/federal/ssp-171`,
            icon: FileText,
            color: "text-indigo-400",
            bg: "bg-indigo-900/50",
            isComplete: false
        },
        {
            step: "3. Assess",
            title: "SAR",
            desc: "Verify control implementation.",
            link: `/clients/${clientId}/federal/sar-171`,
            icon: ClipboardList,
            color: "text-amber-400",
            bg: "bg-amber-900/50",
            isComplete: false
        },
        {
            step: "4. Remediate",
            title: "POA&M",
            desc: "Track and fix weaknesses.",
            link: `/clients/${clientId}/federal/poam`,
            icon: Zap,
            color: "text-red-400",
            bg: "bg-red-900/50",
            isComplete: false
        },
        {
            step: "5. Monitor",
            title: "Continuous",
            desc: "Ongoing monitoring and updates.",
            link: `/clients/${clientId}/federal/monitor`,
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "bg-emerald-900/50",
            isComplete: false
        }
    ];

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
            icon: Shield,
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
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Building2 className="h-8 w-8 text-blue-600" />
                            Federal Compliance Hub
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your DFARS, NIST 800-171/172, and CMMC documentation requirements.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Link href={`/clients/${clientId}/workflows/nist-rmf`}>
                            <Button className="bg-slate-900 hover:bg-black font-bold h-10 px-6 gap-2 shadow-xl shadow-slate-200">
                                <Zap className="h-4 w-4 text-blue-400 fill-current" />
                                Start Guided RMF Journey
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Program Overview Callout */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 mb-6">
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
                        <Link href={`/clients/${clientId}/federal/alignment-guide`}>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold whitespace-nowrap">
                                View Guide <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Workflow Introduction Section */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-6 h-6 text-blue-400" />
                            Getting Started with Federal Compliance
                        </CardTitle>
                        <CardDescription className="text-slate-300">
                            Follow this workflow to achieve and maintain ATO/CMMC certification.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-6 left-10 right-10 h-0.5 bg-slate-700 -z-10"></div>

                            {workflowSteps.map((item, i) => (
                                <Link key={i} href={item.link}>
                                    <div className={`group relative flex flex-col items-center text-center p-4 rounded-xl transition-all cursor-pointer h-full border ${item.isComplete ? 'bg-white/5 border-emerald-500/30' : 'hover:bg-white/10 border-transparent hover:border-white/10'}`}>
                                        <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform relative`}>
                                            <item.icon className={`w-6 h-6 ${item.color}`} />
                                            {item.isComplete && (
                                                <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-slate-900">
                                                    <CheckCircle className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{item.step}</div>
                                        <div className="font-semibold mb-1 text-white">{item.title}</div>
                                        <div className="text-xs text-slate-400 leading-snug">{item.desc}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Metrics Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Readiness Score */}
                    <Card className="card-enhanced border-l-4 border-l-blue-600 bg-blue-50/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-900">Overall Readiness</CardTitle>
                            <Shield className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-700">68%</div>
                            <p className="text-xs text-blue-600 mt-1">Total Completion</p>
                        </CardContent>
                    </Card>

                    {/* Open POA&M Items */}
                    <Card className="card-enhanced border-l-4 border-l-red-500 bg-red-50/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-red-900">Open Gaps</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-red-700">14</div>
                            <p className="text-xs text-red-600 mt-1">POA&M Items Open</p>
                        </CardContent>
                    </Card>


                    {/* System Impact */}
                    <Card className="card-enhanced border-l-4 border-l-indigo-600 bg-indigo-50/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-indigo-900">System Impact</CardTitle>
                            <Lock className="h-4 w-4 text-indigo-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-indigo-700">MOD</div>
                            <p className="text-xs text-indigo-600 mt-1">FIPS 199 Level</p>
                        </CardContent>
                    </Card>

                    {/* Next Audit */}
                    <Card className="card-enhanced border-l-4 border-l-slate-600 bg-slate-50/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900">Next Audit</CardTitle>
                            <Calendar className="h-4 w-4 text-slate-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-700">42</div>
                            <p className="text-xs text-slate-600 mt-1">Days Remaining</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Modules Grid - Categorized */}
                <div className="space-y-6">
                    {categories.map(category => (
                        <div key={category} className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-800 border-l-4 border-blue-600 pl-3">{category}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {modules.filter(m => m.category === category).map((module, idx) => (
                                    <Link key={idx} href={module.path}>
                                        <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-slate-200 group h-full">
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
                                                <p className="text-sm text-slate-500 leading-relaxed mb-4">{module.description}</p>
                                                <div className="flex items-center text-blue-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
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
            </div>
        </DashboardLayout>
    );
}

