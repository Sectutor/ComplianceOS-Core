import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { regulations } from "@/data/regulations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import { ArrowRight, Scale, Shield, Target, Rocket, Activity, AlertCircle } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useClientContext } from "@/contexts/ClientContext";

import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { CircularProgress } from "@complianceos/ui/ui/circular-progress";

export default function RegulationsDashboard() {
    const [location, setLocation] = useLocation();
    const params = useParams<{ id: string }>();
    const generateReport = trpc.regulations.generateReport.useMutation();
    const { selectedClientId } = useClientContext();

    // Prefer URL param, then context, then fallback
    const clientId = params.id ? parseInt(params.id) : (selectedClientId || 1);

    // Fetch Stats for progress
    const { data: stats } = trpc.compliance.frameworkStats.list.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    const getStats = (regName: string) => {
        if (!stats || !Array.isArray(stats)) return { percentage: 0 };
        // Fuzzy match: check if name matches or is contained
        const exact = stats.find(s => s.framework === regName);
        if (exact) return exact;

        return stats.find(s => regName.includes(s.framework) || s.framework.includes(regName)) || { percentage: 0 };
    };

    const getProgressColor = (percentage: number) => {
        if (percentage === 0) return "text-slate-200";
        if (percentage < 30) return "text-red-500";
        if (percentage < 70) return "text-amber-500";
        return "text-emerald-500";
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <Breadcrumb items={[{ label: "Compliance Obligations" }]} />

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold">Compliance Obligations</h1>
                        <p className="text-muted-foreground">Manage your mandatory regulatory requirements distinct from voluntary frameworks.</p>
                    </div>
                    <Button
                        onClick={async (e) => {
                            e.stopPropagation();
                            toast.promise(generateReport.mutateAsync({ clientId }), {
                                loading: 'Generating Report...',
                                success: (data) => {
                                    const link = document.createElement('a');
                                    link.href = `data:application/pdf;base64,${data.pdfBase64}`;
                                    link.download = data.filename;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    return 'Report downloaded successfully';
                                },
                                error: 'Failed to generate report'
                            });
                        }}
                    >
                        Download Gap Analysis
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                    <Card
                        className="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 border-blue-100 bg-blue-50/20"
                        onClick={() => setLocation(`/clients/${clientId}/roadmap`)}
                    >
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Rocket className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Compliance Roadmap</p>
                            <p className="text-[10px] text-muted-foreground">Strategic milestones</p>
                        </div>
                    </Card>

                    <Card
                        className="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 border-red-100 bg-red-50/20"
                        onClick={() => setLocation(`/clients/${clientId}/risks`)}
                    >
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <Target className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Risk Register</p>
                            <p className="text-[10px] text-muted-foreground">High-impact threats</p>
                        </div>
                    </Card>

                    <Card
                        className="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 border-emerald-100 bg-emerald-50/20"
                        onClick={() => setLocation(`/clients/${clientId}/controls`)}
                    >
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Internal Controls</p>
                            <p className="text-[10px] text-muted-foreground">Satisfying obligations</p>
                        </div>
                    </Card>

                    <Card
                        className="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 border-amber-100 bg-amber-50/20"
                        onClick={() => setLocation(`/clients/${clientId}/implementation`)}
                    >
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Implementation</p>
                            <p className="text-[10px] text-muted-foreground">Remediation progress</p>
                        </div>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {regulations.map((reg) => {
                        const regStats = getStats(reg.name);
                        const progressColor = getProgressColor(regStats.percentage);

                        return (
                            <Card key={reg.id} className="group hover:border-primary/50 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md overflow-hidden" onClick={() => setLocation(`/clients/${clientId}/compliance-obligations/${reg.id}`)}>
                                <div className="p-6 flex h-full gap-5">
                                    {/* Left Side: Info */}
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex items-start justify-between mb-3">
                                            {reg.logo ? (
                                                <div className="h-10 w-14 rounded p-0.5 bg-white border flex items-center justify-center">
                                                    <img src={reg.logo} alt={reg.name} className="w-full h-full object-contain" />
                                                </div>
                                            ) : (
                                                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                                                    <Scale className="h-5 w-5" />
                                                </div>
                                            )}
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal hover:bg-slate-200 text-[10px] px-2 py-0.5 h-5">{reg.type}</Badge>
                                        </div>

                                        <div className="mb-auto">
                                            <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors leading-tight mb-2">
                                                {reg.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                {reg.description}
                                            </p>
                                        </div>

                                        <div className="mt-4 pt-2 flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                                            View Details <ArrowRight className="ml-1 h-4 w-4" />
                                        </div>
                                    </div>

                                    {/* Right Side: Progress */}
                                    <div className="flex flex-col items-center justify-center border-l dashed border-slate-100 pl-4 min-w-[120px]">
                                        <CircularProgress
                                            value={regStats.percentage}
                                            size={100}
                                            strokeWidth={10}
                                            color={progressColor}
                                        />
                                        <span className={`mt-3 text-xs font-bold uppercase tracking-wide ${regStats.percentage > 0 ? 'text-slate-700' : 'text-slate-400'}`}>
                                            {regStats.percentage > 0 ? `${regStats.percentage}% Done` : 'Not Started'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}
