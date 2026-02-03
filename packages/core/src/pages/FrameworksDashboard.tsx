import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Input } from "@complianceos/ui/ui/input";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import { Search, Shield, Info, ArrowRight, BookOpen, Upload, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { useClientContext } from "@/contexts/ClientContext";
import { frameworks } from "@/data/frameworks";

import { trpc } from "@/lib/trpc";
import { CircularProgress } from "@complianceos/ui/ui/circular-progress";
import { FrameworkImportDialog } from "@/components/settings/FrameworkImportDialog";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

// Premium Feature: Custom Framework Import
import { CustomFrameworkImportDialog } from "@complianceos/premium/components/frameworks/CustomFrameworkImportDialog";

const FrameworkCard = ({ fw, stats, onClick }: { fw: any, stats: any, onClick: () => void }) => {
    const [imageError, setImageError] = useState(false);
    const progressColor = (percentage: number) => {
        if (percentage === 0) return "text-slate-200";
        if (percentage < 30) return "text-red-500";
        if (percentage < 70) return "text-amber-500";
        return "text-emerald-500";
    };

    // Extract acronym for fallback
    const acronym = fw.name.split(' ')[0].substring(0, 4).toUpperCase();

    return (
        <Card className="group hover:border-primary/50 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md overflow-hidden flex flex-col h-full" onClick={onClick}>
            <div className="p-6 flex h-full gap-5">
                {/* Left Side: Info */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 min-w-[3rem] rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                            {!imageError && fw.logo ? (
                                <img
                                    src={fw.logo}
                                    alt={fw.name}
                                    className="w-full h-full object-contain p-1"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <div className="text-xs font-bold text-slate-700">{acronym}</div>
                            )}
                        </div>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal hover:bg-slate-200 text-[10px] px-2 py-0.5 whitespace-nowrap ml-2">
                            {fw.type}
                        </Badge>
                    </div>

                    <div className="mb-auto">
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors leading-tight mb-2 truncate" title={fw.name}>
                            {fw.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                            {fw.description}
                        </p>
                    </div>

                    <div className="mt-4 pt-2 flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                        View Controls <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                </div>

                {/* Right Side: Progress */}
                <div className="flex flex-col items-center justify-center border-l border-dashed border-slate-100 pl-4 min-w-[100px]">
                    <CircularProgress
                        value={stats.percentage}
                        size={80}
                        strokeWidth={8}
                        color={progressColor(stats.percentage)}
                    />
                    <span className={`mt-3 text-[10px] font-bold uppercase tracking-wide text-center ${stats.percentage > 0 ? 'text-slate-700' : 'text-slate-400'}`}>
                        {stats.percentage > 0 ? `${stats.percentage}% Done` : 'Not Started'}
                    </span>
                </div>
            </div>
        </Card>
    );
};

export default function FrameworksDashboard() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isCustomImportOpen, setIsCustomImportOpen] = useState(false);
    const [, setLocation] = useLocation();
    const { selectedClientId } = useClientContext();
    const clientId = selectedClientId || 1; // Fallback to 1 for demo if no client selected

    // Fetch Stats
    const { data: stats } = trpc.compliance.frameworkStats.list.useQuery(
        { clientId },
        { enabled: !!clientId }
    );

    // Fetch Client for planTier check (Premium gating)
    const { data: client } = trpc.clients.get.useQuery(
        { id: clientId },
        { enabled: !!clientId }
    );
    const isPremium = (client?.planTier === 'pro' || client?.planTier === 'enterprise') && import.meta.env.VITE_ENABLE_PREMIUM !== 'false';

    const filteredFrameworks = frameworks.filter(fw =>
        fw.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fw.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStats = (fwName: string) => {
        if (!stats || !Array.isArray(stats)) return { percentage: 0, total: 0, implemented: 0 };
        // Try exact match first, then fuzzy
        const exact = stats.find((s: any) => s.framework === fwName);
        if (exact) return exact;

        // Fuzzy match: check if one contains the other (e.g. "ISO 27001" inside "ISO 27001:2022")
        return stats.find((s: any) => fwName.includes(s.framework) || s.framework.includes(fwName)) || { percentage: 0, total: 0, implemented: 0 };
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <Breadcrumb
                    items={[
                        { label: "Compliance", href: "/compliance" },
                        { label: "Frameworks Library" },
                    ]}
                />

                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Frameworks Library</h1>
                    <p className="text-muted-foreground">
                        Browse and manage adoption of standard security and privacy frameworks.
                    </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border shadow-sm flex-1 max-w-md">
                        <Search className="h-5 w-5 text-gray-400 ml-2" />
                        <Input
                            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            placeholder="Search frameworks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => setIsImportDialogOpen(true)} variant="outline" className="gap-2">
                            <Upload className="h-4 w-4" />
                            Import Standard
                        </Button>
                        {/* Premium Feature: Import Custom - only for pro/enterprise */}
                        <Button
                            onClick={() => isPremium ? setIsCustomImportOpen(true) : setLocation('/upgrade-required?feature=custom-frameworks')}
                            variant={isPremium ? "default" : "secondary"}
                            className="gap-2"
                        >
                            {isPremium ? <Sparkles className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                            Import Custom
                        </Button>
                    </div>
                </div>

                <FrameworkImportDialog
                    open={isImportDialogOpen}
                    onOpenChange={setIsImportDialogOpen}
                    clientId={clientId}
                />

                {/* Premium: Custom Framework Import - only render if premium */}
                {isPremium && (
                    <CustomFrameworkImportDialog
                        open={isCustomImportOpen}
                        onOpenChange={setIsCustomImportOpen}
                        clientId={clientId}
                        onImport={async (data: any) => {
                            const result = await trpc.frameworkImport.importCustomFramework.mutate({
                                clientId,
                                ...data
                            });
                            if (result.success) {
                                toast.success(`Imported ${result.count} controls!`);
                            }
                            return result;
                        }}
                    />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFrameworks.map((fw) => (
                        <FrameworkCard
                            key={fw.id}
                            fw={fw}
                            stats={getStats(fw.name)}
                            onClick={() => setLocation(`/controls?framework=${encodeURIComponent(fw.name)}`)}
                        />
                    ))}
                    {filteredFrameworks.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                            <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No frameworks found</h3>
                            <p className="text-muted-foreground mt-1">Try adjusting your search terms.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
