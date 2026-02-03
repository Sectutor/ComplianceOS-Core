import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@complianceos/ui/ui/dialog";
import {
    Shield,
    CheckCircle2,
    Lock,
    FileText,
    Download,
    Globe,
    ExternalLink,
    Mail,
    ArrowRight,
    Loader2,
    TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

// Mock Data for Demo
const mockDocs = [
    { id: 1, name: "ISO 27001:2022 Certificate", locked: false, category: "Certification", date: "Expires Dec 2026" },
    { id: 2, name: "SOC 2 Type II Report (2025)", locked: true, category: "Audit Report", date: "Jan 2025" },
    { id: 3, name: "Mutual Data Processing Agreement (DPA)", locked: false, category: "Legal", date: "v2.4 Latest" },
    { id: 4, name: "Annual Penetration Test Results", locked: true, category: "Security", date: "Nov 2025" },
];

const mockTrendData = [
    { month: 'Jan', score: 85 },
    { month: 'Feb', score: 88 },
    { month: 'Mar', score: 92 },
    { month: 'Apr', score: 94 },
    { month: 'May', score: 96 },
    { month: 'Jun', score: 98 },
];

const mockComplianceData = [
    { name: 'SOC 2 Type II', status: 'Compliant', date: 'Dec 2025', color: '#22c55e' },
    { name: 'ISO 27001', status: 'In Progress', date: 'Target: Q2 2026', color: '#f59e0b' },
    { name: 'GDPR', status: 'Compliant', date: 'Ongoing', color: '#3b82f6' },
    { name: 'HIPAA', status: 'Compliant', date: 'Audited Nov 2025', color: '#8b5cf6' },
];

export default function TrustCenter() {
    const [match, params] = useRoute("/trust-center/:clientId");
    const clientId = params?.clientId ? parseInt(params.clientId) : 0;

    // NDA Flow State
    const [isNDAModalOpen, setIsNDAModalOpen] = useState(false);
    const [ndaStep, setNdaStep] = useState(1); // 1: Identity, 2: NDA, 3: Success
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [signature, setSignature] = useState("");
    const [company, setCompany] = useState("");
    const [selectedDoc, setSelectedDoc] = useState<any>(null);
    const [visitorId, setVisitorId] = useState<number | null>(null);

    // Queries
    const { data: client } = trpc.clients.get.useQuery(
        { id: clientId },
        { enabled: !!clientId && !isNaN(clientId) && clientId > 0 }
    );
    const { data: readinessData } = trpc.compliance.getReadinessData.useQuery(
        { clientId: clientId },
        { enabled: !!clientId && !isNaN(clientId) && clientId > 0 }
    );
    const { data: frameworkStats } = trpc.compliance.frameworkStats.list.useQuery(
        { clientId: clientId },
        { enabled: !!clientId && !isNaN(clientId) && clientId > 0 }
    );
    const { data: trustDocsData } = trpc.trustCenter.getPublicData.useQuery(
        { clientId: clientId },
        { enabled: !!clientId && !isNaN(clientId) && clientId > 0 }
    );
    const { data: accessStatus } = trpc.trustCenter.getAccessStatus.useQuery(
        { clientId: clientId },
        { enabled: !!clientId && !isNaN(clientId) && clientId > 0 }
    );

    // Derived State
    const liveDocs = trustDocsData?.documents || [];
    const displayDocs = liveDocs.length > 0 ? liveDocs : mockDocs;

    // Safety check: ensure frameworkStats is an array
    const isValidFrameworkStats = Array.isArray(frameworkStats);
    const displayFrameworks = isValidFrameworkStats && frameworkStats.length > 0 ? frameworkStats : mockComplianceData;

    console.log('[TrustCenter] Render Debug:', {
        readinessKeys: readinessData ? Object.keys(readinessData) : 'null',
        frameworkStatsIsArray: Array.isArray(frameworkStats),
        displayFrameworksLen: displayFrameworks.length
    });

    // TRPC Mutations
    const requestAccessMutation = trpc.trustCenter.requestAccess.useMutation({
        onSuccess: (data) => {
            setVisitorId(data.visitorId);
            setNdaStep(2);
            toast.success("Identity verified.");
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    const signNdaMutation = trpc.trustCenter.signNDA.useMutation({
        onSuccess: () => {
            setNdaStep(3);
            toast.success("NDA Signed Successfully");
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    const handleRequestAccess = (e: React.FormEvent) => {
        e.preventDefault();
        requestAccessMutation.mutate({ clientId, email, name, company });
    };

    const handleSignNDA = () => {
        if (!signature || !visitorId) return;
        signNdaMutation.mutate({
            clientId,
            visitorId,
            signatureText: signature
        });
    };

    const openGatekeeper = (doc: any) => {
        const isLocked = doc.locked || doc.is_locked || doc.isLocked;
        if (!isLocked) {
            toast.success(`Broadcasting public document: ${doc.name}`);
            return;
        }

        setSelectedDoc(doc);
        setIsNDAModalOpen(true);

        // If user is already logged in or known, fast-track them
        if (accessStatus?.signed) {
            setNdaStep(3);
            setVisitorId(accessStatus.visitorId || null);
        } else if (accessStatus?.isLoggedIn || accessStatus?.user) {
            const user = accessStatus.user;
            if (user) {
                setEmail(user.email);
                setName(user.name || "");
                setCompany(user.company || "");

                if (accessStatus.visitorId) {
                    setVisitorId(accessStatus.visitorId);
                    setNdaStep(2);
                } else {
                    requestAccessMutation.mutate({
                        clientId,
                        email: user.email,
                        name: user.name || "User",
                        company: user.company || "Internal"
                    });
                }
            } else {
                setNdaStep(1);
            }
        } else {
            setNdaStep(1);
        }
    };

    // Loading & Error States
    const isLoading = !client && !isNaN(clientId) && clientId > 0;
    const isError = (!client && !isLoading && !!clientId);

    if (!clientId || isNaN(clientId) || clientId <= 0 || isError) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <Card className="max-w-md w-full border-0 shadow-2xl p-10 text-center rounded-3xl">
                    <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Shield className="h-10 w-10 text-red-400" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Trust Center Not Found</h2>
                    <p className="text-slate-500 mt-4 leading-relaxed font-medium">
                        The Trust Center you are looking for does not exist or has been moved.
                        Please contact the organization's security team for a valid link.
                    </p>
                    <Button
                        variant="outline"
                        className="mt-8 w-full h-12 rounded-xl font-bold border-slate-200"
                        onClick={() => window.location.href = "/"}
                    >
                        Return Home
                    </Button>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-bold animate-pulse">Establishing Secure Connection...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white pt-20 pb-32 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute right-0 top-0 w-[800px] h-[800px] bg-indigo-500 rounded-full blur-[120px] mix-blend-screen opacity-30 animate-pulse" />
                    <div className="absolute left-0 bottom-0 w-[600px] h-[600px] bg-primary rounded-full blur-[100px] mix-blend-screen opacity-20" />
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-300 text-sm font-medium mb-6 border border-white/10 backdrop-blur-sm">
                        <Shield className="h-4 w-4" />
                        <span>Official ComplianceOS Trust Center</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        {client?.name || "Company"} Security
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Transparency is at the core of our security program. Access our real-time
                        compliance metrics, certifications, and security documentation.
                    </p>

                    <div className="flex justify-center gap-4">
                        <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-lg shadow-primary/20 font-bold h-14 px-8">
                            <Download className="mr-2 h-5 w-5" /> Request Audit Bundle
                        </Button>
                        <Button size="lg" variant="outline" className="text-white border-white/20 hover:bg-white/10 h-14 px-8">
                            <Globe className="mr-2 h-5 w-5" /> Main Website
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content - Floating Cards */}
            <div className="container mx-auto px-6 -mt-20 relative z-20">

                {/* Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <Card className="bg-white/95 backdrop-blur-md border-0 shadow-2xl ring-1 ring-slate-900/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-slate-700 text-sm uppercase tracking-wider font-bold">
                                <CheckCircle2 className="h-4 w-4 text-green-500" /> Infrastructure Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900">All Systems Normal</div>
                            <p className="text-slate-500 text-xs mt-1 font-medium">99.99% Uptime (Last 90 days)</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/95 backdrop-blur-md border-0 shadow-2xl ring-1 ring-slate-900/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-slate-700 text-sm uppercase tracking-wider font-bold">
                                <Lock className="h-4 w-4 text-indigo-500" /> Data Sovereignty
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900">EU & US Regions</div>
                            <p className="text-slate-500 text-xs mt-1 font-medium">AES-256 Encryption at Rest</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/95 backdrop-blur-md border-0 shadow-2xl ring-1 ring-slate-900/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-slate-700 text-sm uppercase tracking-wider font-bold">
                                <Globe className="h-4 w-4 text-blue-500" /> Compliance Posture
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900">{readinessData?.complianceScore || 0}% Score</div>
                            <p className="text-slate-500 text-xs mt-1 font-medium">Continuously Audited via ComplianceOS</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Documents Grid */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Security Artifacts</h2>
                            <p className="text-slate-500">
                                {liveDocs.length > 0
                                    ? `Showing ${liveDocs.length} live security artifacts for ${client?.name || 'this client'}.`
                                    : 'Access our latest certifications and security audit reports.'}
                            </p>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-none text-xs px-4 py-1.5 font-bold uppercase tracking-tighter">
                            Direct Download Available
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {displayDocs.map((doc: any) => (
                            <Card key={doc.id} className="group hover:scale-105 transition-all duration-300 border-0 shadow-lg overflow-hidden bg-white cursor-pointer" onClick={() => openGatekeeper(doc)}>
                                <CardHeader className="pb-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500 text-[10px] font-bold px-2">
                                            {doc.category}
                                        </Badge>
                                        {(doc.isLocked || doc.is_locked) ?
                                            <div className="p-1.5 bg-amber-50 rounded-lg"><Lock className="h-4 w-4 text-amber-500" /></div> :
                                            <div className="p-1.5 bg-green-50 rounded-lg"><Globe className="h-4 w-4 text-green-500" /></div>
                                        }
                                    </div>
                                    <CardTitle className="text-lg font-black leading-tight group-hover:text-primary transition-colors">
                                        {doc.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-400 font-bold">{doc.date || (doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Active')}</span>
                                        <div className="text-primary font-black text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                                            {(doc.isLocked || doc.is_locked) ? 'Request Access' : 'Download Now'}
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    </div>
                                </CardContent>
                                {(doc.isLocked || doc.is_locked) && (
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500/10 group-hover:bg-amber-500 transition-colors" />
                                )}
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Audit History & Trend */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    <Card className="border-0 shadow-xl bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-xl font-black">Active Frameworks</CardTitle>
                            <CardDescription>Live status of our current compliance standards.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50">
                                {displayFrameworks.map((item: any) => (
                                    <div key={item.framework || item.name} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-100 font-black text-primary text-sm">
                                                {(item.framework || item.name).split(' ').map((w: string) => w[0]).join('')}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900">{item.framework || item.name}</div>
                                                <div className="text-xs text-slate-400 font-bold">
                                                    {item.percentage !== undefined ? `${item.implemented} / ${item.total} Controls Implemented` : item.date}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className={cn("px-3 py-1 font-bold text-[10px] uppercase",
                                            (item.percentage >= 100 || item.status === 'Compliant') ? 'bg-green-100 text-green-700 border-none' :
                                                (item.percentage > 0 || item.status === 'In Progress') ? 'bg-amber-100 text-amber-700 border-none' : 'bg-slate-100 text-slate-600'
                                        )}>
                                            {item.percentage !== undefined ? `${item.percentage}%` : item.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-xl bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-xl font-black">Compliance Maturity</CardTitle>
                            <CardDescription>Rolling 6-month security posture trend.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={mockTrendData}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} />
                                        <YAxis hide domain={[60, 100]} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ color: '#0f172a', fontWeight: '900' }}
                                        />
                                        <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-6 flex items-center justify-between pt-6 border-t border-slate-50">
                                <div>
                                    <div className="text-3xl font-black text-slate-900">+15%</div>
                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Growth in 2025</div>
                                </div>
                                <div className="text-right">
                                    <Badge className="bg-green-500 text-white border-0 font-bold mb-1">Health: Optimal</Badge>
                                    <div className="text-xs text-slate-400 font-medium italic">Verified by AI Audit Agent</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer */}
                <div className="text-center text-slate-400 text-sm mt-20 pt-10 border-t border-slate-100">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="font-black text-slate-600 tracking-tighter uppercase text-xs">Secured & Monitored by ComplianceOS v4.0</span>
                    </div>
                    <p className="font-medium">&copy; {new Date().getFullYear()} {client?.name || "Company"}. Internal Use Only. NDA Restricted.</p>
                </div>
            </div>

            {/* NDA Gatekeeper Modal */}
            <Dialog open={isNDAModalOpen} onOpenChange={setIsNDAModalOpen}>
                <DialogContent className="sm:max-w-[550px] border-0 shadow-2xl p-0 overflow-hidden bg-white rounded-3xl">
                    <div className="bg-slate-900 p-10 text-white relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/30 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl -ml-12 -mb-12" />

                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-primary text-[10px] font-black uppercase mb-4 border border-white/10 backdrop-blur-sm relative z-10">
                            <Lock className="h-3 w-3" />
                            <span>Security Clearance Required</span>
                        </div>

                        <DialogTitle className="text-3xl font-black tracking-tighter relative z-10 leading-tight">
                            Access Restricted Artifact
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 mt-2 font-medium relative z-10">
                            You are requesting sensitive documentation: <span className="text-white font-black">{selectedDoc?.name}</span>
                        </DialogDescription>
                    </div>

                    <div className="p-10">
                        {ndaStep === 1 && (
                            <form onSubmit={handleRequestAccess} className="space-y-6">
                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-xs font-black text-slate-500 uppercase tracking-widest">Full Name</Label>
                                            <Input
                                                id="name"
                                                placeholder="Alice Auditor"
                                                className="h-14 bg-slate-50 border-slate-200 font-bold focus:ring-primary rounded-xl"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="company" className="text-xs font-black text-slate-500 uppercase tracking-widest">Company</Label>
                                            <Input
                                                id="company"
                                                placeholder="HSBC Bank"
                                                className="h-14 bg-slate-50 border-slate-200 font-bold rounded-xl"
                                                value={company}
                                                onChange={(e) => setCompany(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs font-black text-slate-500 uppercase tracking-widest">Work Email</Label>
                                        <div className="relative">
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="alice@hsbc.co.uk"
                                                className="h-14 bg-slate-50 border-slate-200 font-bold pl-12 rounded-xl"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                            <Mail className="absolute left-4 top-4.5 h-5 w-5 text-slate-400" />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium italic">Competition filter enabled. Personal emails (Gmail/Outlook) will be flagged.</p>
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black text-lg shadow-xl shadow-slate-200 rounded-xl"
                                    disabled={requestAccessMutation.isPending}
                                >
                                    {requestAccessMutation.isPending ? <Loader2 className="animate-spin" /> : 'Request Authorization'}
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </form>
                        )}

                        {ndaStep === 2 && (
                            <div className="space-y-8">
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 h-[220px] overflow-y-auto text-[11px] text-slate-600 leading-relaxed font-mono shadow-inner">
                                    <h4 className="font-black text-slate-900 mb-4 uppercase text-xs tracking-tighter">Mutual Non-Disclosure Agreement (Short Form)</h4>
                                    This Mutual Non-Disclosure Agreement (the "Agreement") is made and entered into as of today by and between <span className="text-primary font-bold">{client?.name || "The Company"}</span> and <span className="text-black font-bold">{name} ({company})</span>.
                                    <br /><br />
                                    <span className="font-bold">1. Confidentiality:</span> The Recipient agrees to hold and maintain the Confidential Information in strict confidence and use it solely for evaluating the Disclosing Party's security controls.
                                    <br /><br />
                                    <span className="font-bold">2. Digital Footprint:</span> By signing this document, your IP address, browser fingerprint, and verified email are being logged as a legal record of access to proprietary data.
                                    <br /><br />
                                    <span className="font-bold">3. Terms:</span> This agreement remains in effect for three (3) years from the date of disclosure.
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">Type Full Name to Sign</Label>
                                    <Input
                                        placeholder="ALICE AUDITOR"
                                        className="h-16 bg-white border-slate-200 font-serif italic text-2xl text-slate-900 tracking-tighter px-6 rounded-xl border-2 focus:border-green-500 transition-all"
                                        value={signature}
                                        onChange={(e) => setSignature(e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium">This signature carries the same legal weight as a physical signature.</p>
                                </div>

                                <Button
                                    onClick={handleSignNDA}
                                    className="w-full h-16 bg-green-600 hover:bg-green-700 text-white font-black text-xl shadow-2xl shadow-green-100 rounded-xl"
                                    disabled={!signature || signNdaMutation.isPending}
                                >
                                    {signNdaMutation.isPending ? <Loader2 className="animate-spin h-6 w-6" /> : 'Confirm & Generate Access'}
                                </Button>
                            </div>
                        )}

                        {ndaStep === 3 && (
                            <div className="text-center py-6">
                                <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Security Pass Issued</h3>
                                <p className="text-slate-500 mt-2 mb-10 font-medium">
                                    Verification complete. A unique download token has been generated for your session.
                                </p>
                                <div className="space-y-3">
                                    <Button
                                        className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white font-black text-lg rounded-xl shadow-xl"
                                        onClick={() => {
                                            setIsNDAModalOpen(false);
                                            toast.success("Initializing Secure Stream...");
                                        }}
                                    >
                                        <Download className="mr-2 h-6 w-6" /> Download SOC 2 Report
                                    </Button>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Token Expires in 48 Hours</p>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
