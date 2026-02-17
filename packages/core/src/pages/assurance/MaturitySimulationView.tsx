import React, { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Progress } from "@complianceos/ui/ui/progress";
import {
    Shield, Target, CheckCircle2, Info,
    ChevronLeft, LayoutGrid, ClipboardCheck,
    TrendingUp, FileText, Plus, Check, ExternalLink,
    Zap, Layers, BarChart3, Save, History, Eye,
    ArrowRight,
    Clock
} from "lucide-react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import { cn } from "@complianceos/ui/lib/utils";
import { Slider } from "@complianceos/ui/ui/slider";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogFooter
} from "@complianceos/ui/ui/dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";

export default function MaturitySimulationView() {
    const { id, frameworkId } = useParams<{ id: string, frameworkId: string }>();
    const clientId = parseInt(id || "0");
    const [_location, setLocation] = useLocation();

    // State
    const [targetLevel, setTargetLevel] = useState<number>(2);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [simName, setSimName] = useState("");
    const [simDesc, setSimDesc] = useState("");

    // Queries
    const { data: frameworks } = trpc.maturity.getFrameworks.useQuery();
    const { data: frameworkData } = trpc.maturity.getFrameworkData.useQuery({ frameworkId });
    const { data: simulation, isLoading: loadingSim } = trpc.maturity.runSimulation.useQuery({
        clientId,
        frameworkId,
        config: {
            targetLevel,
            categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined
        }
    });
    const { data: savedSimulations, refetch: refetchSaved } = trpc.maturity.getSimulations.useQuery({ clientId, frameworkId });

    // Mutation
    const saveMutation = trpc.maturity.saveSimulation.useMutation();

    const activeFramework = useMemo(() =>
        frameworks?.find(f => f.id === frameworkId),
        [frameworks, frameworkId]
    );

    const handleSaveSimulation = async () => {
        if (!simName) {
            toast.error("Please enter a name for the simulation");
            return;
        }

        try {
            await saveMutation.mutateAsync({
                clientId,
                frameworkId,
                name: simName,
                description: simDesc,
                config: { targetLevel, categoryIds: selectedCategories },
                results: {
                    projectedScore: simulation?.projectedScore,
                    gapCount: simulation?.gapCount,
                    estimatedEffort: simulation?.estimatedEffort,
                    impactScore: simulation?.impactScore
                }
            });
            toast.success("Simulation saved successfully");
            setIsSaveDialogOpen(false);
            refetchSaved();
        } catch (error) {
            toast.error("Failed to save simulation");
        }
    };

    if (!activeFramework) return null;

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-6 pb-12">
                <Breadcrumb
                    items={[
                        { label: "Assurance", href: `/clients/${clientId}/assurance` },
                        { label: activeFramework.name, href: `/clients/${clientId}/${frameworkId}` },
                        { label: "Roadmap Simulation", active: true }
                    ]}
                />

                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 -ml-2 text-slate-500 hover:text-slate-900"
                            onClick={() => setLocation(`/clients/${clientId}/${frameworkId}`)}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Assessment
                        </Button>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            <Zap className="w-10 h-10 text-primary" />
                            Strategic Roadmap Simulator
                        </h1>
                        <p className="text-slate-500 font-medium max-w-2xl">
                            Model the impact of security investments and define your path to maturity for {activeFramework.name}.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl px-6">
                                    <Save className="w-4 h-4" />
                                    Save Scenario
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] rounded-3xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black">Save Strategic Scenario</DialogTitle>
                                    <DialogDescription className="font-medium">
                                        Save these parameters as a reusable roadmap scenario for your board reports.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Scenario Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g., Q3 Foundation Sprint"
                                            className="rounded-xl border-slate-200"
                                            value={simName}
                                            onChange={(e) => setSimName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-500">Short Description</Label>
                                        <textarea
                                            id="description"
                                            className="w-full min-h-[100px] border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20"
                                            placeholder="What is the strategic goal of this simulation?"
                                            value={simDesc}
                                            onChange={(e) => setSimDesc(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        onClick={handleSaveSimulation}
                                        className="w-full bg-primary text-white font-bold rounded-xl h-12"
                                        disabled={saveMutation.isLoading}
                                    >
                                        {saveMutation.isLoading ? "Saving..." : "Save Roadmap Scenario"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {/* Controls Panel */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white sticky top-6">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                                <CardTitle className="text-lg font-black flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-primary" />
                                    Simulation Parameters
                                </CardTitle>
                                <CardDescription className="font-medium">Adjust variables to see real-time impact.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-8">
                                {/* Target Level Slider */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-black text-slate-900">Target Maturity Level</label>
                                        <Badge className="bg-primary text-white font-black px-3">Level {targetLevel}</Badge>
                                    </div>
                                    <Slider
                                        defaultValue={[targetLevel]}
                                        max={activeFramework.levels.length}
                                        min={1}
                                        step={1}
                                        onValueChange={(vals) => setTargetLevel(vals[0])}
                                        className="py-4"
                                    />
                                    <p className="text-xs text-slate-500 italic">
                                        Model requirements up to {activeFramework.levels.find(l => l.level === targetLevel)?.name || `Level ${targetLevel}`}.
                                    </p>
                                </div>

                                {/* Category Selection */}
                                <div className="space-y-4">
                                    <label className="text-sm font-black text-slate-900 block">Focus Pillars</label>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {frameworkData?.categories.map((cat) => (
                                            <div
                                                key={cat.id}
                                                onClick={() => {
                                                    if (selectedCategories.includes(cat.id)) {
                                                        setSelectedCategories(selectedCategories.filter(id => id !== cat.id));
                                                    } else {
                                                        setSelectedCategories([...selectedCategories, cat.id]);
                                                    }
                                                }}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border",
                                                    selectedCategories.includes(cat.id)
                                                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                                        : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px]",
                                                    selectedCategories.includes(cat.id) ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                                                )}>
                                                    {cat.code}
                                                </div>
                                                <span className="text-xs font-bold truncate flex-1">{cat.name}</span>
                                                {selectedCategories.includes(cat.id) && <Check className="w-4 h-4 text-primary" />}
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        className="text-[10px] text-primary font-black uppercase tracking-widest p-0 h-auto"
                                        onClick={() => setSelectedCategories([])}
                                    >
                                        Clear Selection
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
                            <CardHeader className="p-6">
                                <CardTitle className="text-lg font-black flex items-center gap-2">
                                    <History className="w-5 h-5 text-slate-400" />
                                    Saved Scenarios
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 pt-0 space-y-3">
                                {savedSimulations?.length === 0 && (
                                    <p className="text-xs text-slate-400 italic text-center py-4">No scenarios saved yet.</p>
                                )}
                                {savedSimulations?.map((sim) => (
                                    <div key={sim.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/30 transition-all group">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-primary transition-colors">{sim.name}</h4>
                                            <Badge variant="outline" className="text-[10px] bg-white">Score: {sim.results?.projectedScore}%</Badge>
                                        </div>
                                        <p className="text-[10px] text-slate-500 line-clamp-2 mb-3">{sim.description}</p>
                                        <Button variant="ghost" size="xs" className="w-full text-xs font-bold gap-2 bg-white rounded-lg">
                                            <Eye className="w-3 h-3" />
                                            View Scenario
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Results Panel */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        {/* Simulation Result Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="rounded-3xl border-slate-200 shadow-lg shadow-primary/5 overflow-hidden bg-white border-l-8 border-l-primary">
                                <CardContent className="p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="p-3 bg-blue-50 rounded-2xl">
                                            <BarChart3 className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Projected Maturity</span>
                                            <div className="flex items-center gap-2 justify-end">
                                                <span className="text-slate-400 line-through text-lg">{Math.round(simulation?.currentScore || 0)}%</span>
                                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                                <span className="text-4xl font-black text-slate-900">{Math.round(simulation?.projectedScore || 0)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-500">Progress Gained</span>
                                            <span className="text-emerald-600">+{Math.round(simulation?.impactScore || 0)}% Improvement</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                            <div className="h-full bg-slate-300" style={{ width: `${simulation?.currentScore}%` }} />
                                            <div className="h-full bg-primary animate-pulse" style={{ width: `${simulation?.impactScore}%` }} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-3xl border-slate-200 shadow-lg shadow-orange-500/5 overflow-hidden bg-white border-l-8 border-l-orange-500">
                                <CardContent className="p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="p-3 bg-orange-50 rounded-2xl">
                                            <Clock className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Investment</span>
                                            <div className="flex items-center gap-2 justify-end">
                                                <span className="text-4xl font-black text-slate-900">{simulation?.estimatedEffort || 0}</span>
                                                <span className="text-lg font-bold text-slate-400">Hours</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-500">Critical Requirements addressed</span>
                                            <span className="text-orange-600">{simulation?.gapCount || 0} Control Gaps</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {Array.from({ length: 10 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "h-2 flex-1 rounded-full",
                                                        i < (simulation?.gapCount || 0) / 5 ? "bg-orange-500" : "bg-slate-100"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Gap List */}
                        <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
                            <CardHeader className="p-8 border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-black">Implementation Roadmap</CardTitle>
                                        <CardDescription className="font-medium">Specific controls targeted in this simulation scenario.</CardDescription>
                                    </div>
                                    <Badge className="bg-slate-900 text-white font-bold">{simulation?.simulationRequirements.length} Items</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {simulation?.simulationRequirements.length === 0 && (
                                        <div className="p-12 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900">Maturity Target Met</h3>
                                            <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                                Based on current assessments, you have already achieved the selected maturity levels for these pillars.
                                            </p>
                                        </div>
                                    )}
                                    {simulation?.simulationRequirements.map((req: any) => (
                                        <div key={req.id} className="p-6 hover:bg-slate-50/50 transition-all flex items-center justify-between group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center font-black text-xs group-hover:border-primary/50 transition-colors">
                                                    {req.code}
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{req.title}</h4>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                            Maturity Level {req.level}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            ~{req.level * 16}h Effort
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-all gap-2 text-primary font-bold">
                                                Details
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
