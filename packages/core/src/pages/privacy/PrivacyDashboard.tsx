
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { trpc } from "@/lib/trpc";
import {
    Shield,
    FileText,
    Users,
    Database,
    ArrowRight,
    Scale,
    Lock,
    Eye,
    Zap,
    Globe,
    AlertTriangle
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Skeleton } from "@complianceos/ui/ui/skeleton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useClientContext } from "@/contexts/ClientContext";


export default function PrivacyDashboard() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const params = useParams();
    const { selectedClientId } = useClientContext();

    // Parse ID from URL safely
    const urlClientId = parseInt((params as any)?.id || "0");
    const clientId = selectedClientId || urlClientId;

    const { data: stats, isLoading: statsLoading } = trpc.privacy.getPrivacyStats.useQuery(
        { clientId: clientId },
        { enabled: !!clientId }
    );
    const { data: client } = trpc.clients.get.useQuery(
        { id: clientId || 0 },
        { enabled: !!clientId }
    );

    if (!selectedClientId) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-muted-foreground">Please select a client to view privacy dashboard.</p>
            </div>
        );
    }

    const cards = [
        {
            title: "Data Inventory",
            description: "Manage personal data assets & classification",
            icon: Database,
            path: `/clients/${selectedClientId}/privacy/inventory`,
            stats: stats ? `${stats.piiAssetCount} Assets` : "...",
            color: "text-blue-500",
            bg: "bg-primary/10"
        },
        {
            title: "ROPA",
            description: "Record of Processing Activities & Data Flows",
            icon: FileText,
            path: `/clients/${selectedClientId}/privacy/ropa`,
            stats: "View Map",
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        },
        {
            title: "DSAR Manager",
            description: "Handle Data Subject Access Requests",
            icon: Users,
            path: `/clients/${selectedClientId}/privacy/dsar`,
            stats: stats ? `${stats.activeDsarCount} Active` : "...",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        },
        {
            title: "DPI Assessments",
            description: "Risk assessments for high-impact processes",
            icon: Scale,
            path: `/clients/${selectedClientId}/privacy/dpia`,
            stats: "Evaluate",
            color: "text-indigo-500",
            bg: "bg-indigo-500/10"
        },
        {
            title: "Int'l Transfers",
            description: "Cross-border data flows & TIAs",
            icon: Globe,
            path: `/clients/${selectedClientId}/privacy/transfers`,
            stats: "Verify",
            color: "text-cyan-500",
            bg: "bg-cyan-500/10"
        },
        {
            title: "Breach Register",
            description: "Personal data breach incident management",
            icon: AlertTriangle,
            path: `/clients/${selectedClientId}/privacy/breaches`,
            stats: "Respond",
            color: "text-rose-500",
            bg: "bg-rose-500/10"
        }
    ];

    return (
        <div className="space-y-8 page-transition">
            <Breadcrumb
                items={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: client?.name || "Client", href: `/clients/${selectedClientId}` },
                    { label: "Privacy" },
                ]}
            />

            <div className="flex items-start justify-between animate-slide-down">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Privacy Compliance</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage GDPR, CCPA, and data privacy operations
                    </p>
                </div>
            </div>

            {/* Privacy Masterclass Callout */}
            <Card className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white border-0 shadow-2xl overflow-hidden group cursor-pointer" onClick={() => setLocation(`/clients/${selectedClientId}/privacy/overview`)}>
                <CardContent className="p-0 relative">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                    <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="space-y-2">
                            <div className="inline-flex items-center space-x-2 bg-white/10 px-2 py-0.5 rounded-full border border-white/20 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                                <Zap className="w-3 h-3" />
                                <span>Knowledge Hub</span>
                            </div>
                            <h2 className="text-2xl font-bold">Privacy Framework Overview</h2>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Understand the integrated workflow between ROPA, Risk Assessments (DPIA), International Transfers, and Breach Management.
                            </p>
                        </div>
                        <Button className="bg-white text-slate-900 hover:bg-cyan-50 font-bold px-6 py-6 h-auto rounded-xl shadow-lg group-hover:translate-x-1 transition-transform">
                            Explore Masterclass
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Main Navigation Cards */}
            <div className="dashboard-grid grid gap-6 md:grid-cols-3">
                {cards.map((card) => (
                    <Card
                        key={card.title}
                        className="hover-lift shadow-premium transition-all cursor-pointer border-l-4"
                        style={{ borderLeftColor: card.color.split('-')[1] }} // Approximate styling
                        onClick={() => setLocation(card.path)}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {card.title}
                            </CardTitle>
                            <div className={`p-2 rounded-full ${card.bg}`}>
                                <card.icon className={`h-4 w-4 ${card.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold metric-value">{statsLoading ? <Skeleton className="h-8 w-16" /> : card.stats}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {card.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions / Highlights */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Scale className="h-5 w-5 text-indigo-500" />
                            Readiness Assessment
                        </CardTitle>
                        <CardDescription>
                            Evaluate your posture against privacy regulations
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg hover-lift transition-all">
                            <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="font-medium">GDPR Checklist</p>
                                    <p className="text-xs text-muted-foreground">Evaluate compliance</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setLocation(`/clients/${selectedClientId}/privacy/assessment/gdpr`)}>Start</Button>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg hover-lift transition-all">
                            <div className="flex items-center gap-3">
                                <Lock className="h-5 w-5 text-emerald-600" />
                                <div>
                                    <p className="font-medium">CCPA/CPRA Checklist</p>
                                    <p className="text-xs text-muted-foreground">California Privacy Rights</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setLocation(`/clients/${selectedClientId}/privacy/assessment/ccpa`)}>Start</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5 text-amber-500" />
                            Recent Privacy Activity
                        </CardTitle>
                        <CardDescription>
                            Latest updates to PI assets and requests
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            <p>No recent activity recorded.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
