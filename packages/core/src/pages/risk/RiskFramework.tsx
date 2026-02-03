import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2, Info, Activity, Edit2, ChevronLeft, Users, Mail, Building, Briefcase } from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@complianceos/ui/ui/table";
import { Badge } from "@complianceos/ui/ui/badge";

export default function RiskFramework() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [activeTab, setActiveTab] = useState("scope");

    // Data Fetching
    const { data: client } = trpc.clients.get.useQuery({ id: clientId }, { enabled: !!clientId });
    const { data: stakeholders } = trpc.risks.getStakeholders.useQuery({ clientId }, { enabled: !!clientId });
    const { data: settings, isLoading, refetch } = trpc.riskSettings.get.useQuery({ clientId }, { enabled: !!clientId });

    // Local State for Form
    const [formData, setFormData] = useState({
        scope: "",
        context: "",
        riskAppetite: "",
        methodology: "ISO 27005"
    });

    const [impactCriteria, setImpactCriteria] = useState<{ level: number, name: string, description: string }[]>([]);
    const [likelihoodCriteria, setLikelihoodCriteria] = useState<{ level: number, name: string, description: string }[]>([]);
    const [riskTolerance, setRiskTolerance] = useState<{ category: string, threshold: string, unit: string }[]>([]);

    // Sync data when loaded
    useEffect(() => {
        if (settings) {
            setFormData({
                scope: settings.scope || "",
                context: settings.context || "",
                riskAppetite: settings.riskAppetite || "",
                methodology: settings.methodology || "ISO 27005"
            });

            setImpactCriteria(settings.impactCriteria?.length ? settings.impactCriteria : [
                { level: 1, name: "Negligible", description: " minimal effect on purposes" },
                { level: 2, name: "Low", description: "minor effect" },
                { level: 3, name: "Medium", description: "significant effect" },
                { level: 4, name: "High", description: "major effect" },
                { level: 5, name: "Critical", description: "catastrophic effect" }
            ]);

            setLikelihoodCriteria(settings.likelihoodCriteria?.length ? settings.likelihoodCriteria : [
                { level: 1, name: "Rare", description: "Happens once every few years" },
                { level: 2, name: "Unlikely", description: "Happens once a year" },
                { level: 3, name: "Possible", description: "Happens once a month" },
                { level: 4, name: "Likely", description: "Happens once a week" },
                { level: 5, name: "Almost Certain", description: "Happens daily" }
            ]);

            setRiskTolerance(settings.riskTolerance?.length ? settings.riskTolerance : []);
        }
    }, [settings]);

    const updateMutation = trpc.riskSettings.update.useMutation({
        onSuccess: () => {
            toast.success("Risk Framework updated");
            refetch();
        },
        onError: (err) => toast.error("Failed to update: " + err.message)
    });

    const handleSave = () => {
        updateMutation.mutate({
            clientId,
            ...formData,
            ...formData,
            impactCriteria,
            likelihoodCriteria,
            riskTolerance
        });
    };

    // KRI State & Mutations
    const [isKriDialogOpen, setIsKriDialogOpen] = useState(false);
    const [editingKri, setEditingKri] = useState<any>(null);
    const [kriFormData, setKriFormData] = useState({
        name: "",
        description: "",
        thresholdGreen: "",
        thresholdAmber: "",
        thresholdRed: "",
        currentValue: "",
        currentStatus: "green"
    });

    const { data: kris, refetch: refetchKris } = trpc.kris.list.useQuery({ clientId }, { enabled: !!clientId });
    const { refetch: refetchStakeholders } = trpc.risks.getStakeholders.useQuery({ clientId }, { enabled: !!clientId });

    // Stakeholder Mutations
    const [isStakeholderDialogOpen, setIsStakeholderDialogOpen] = useState(false);
    const [stakeholderFormData, setStakeholderFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        role: "",
        department: ""
    });

    const createStakeholderMutation = trpc.risks.createStakeholder.useMutation({
        onSuccess: () => {
            toast.success("Stakeholder added");
            refetchStakeholders();
            setIsStakeholderDialogOpen(false);
            setStakeholderFormData({ firstName: "", lastName: "", email: "", role: "", department: "", phone: "" });
        },
        onError: (err) => toast.error("Failed to add stakeholder: " + err.message)
    });

    const deleteStakeholderMutation = trpc.risks.deleteStakeholder.useMutation({
        onSuccess: () => {
            toast.success("Stakeholder deleted");
            refetchStakeholders();
        },
        onError: (err) => toast.error("Failed to delete: " + err.message)
    });

    const handleSaveStakeholder = () => {
        createStakeholderMutation.mutate({
            clientId,
            ...stakeholderFormData
        });
    };

    const createKriMutation = trpc.kris.create.useMutation({
        onSuccess: () => {
            toast.success("KRI created");
            refetchKris();
            setIsKriDialogOpen(false);
        },
        onError: (err) => toast.error("Failed to create KRI: " + err.message)
    });

    const updateKriMutation = trpc.kris.update.useMutation({
        onSuccess: () => {
            toast.success("KRI updated");
            refetchKris();
            setIsKriDialogOpen(false);
        },
        onError: (err) => toast.error("Failed to update KRI: " + err.message)
    });

    const deleteKriMutation = trpc.kris.delete.useMutation({
        onSuccess: () => {
            toast.success("KRI deleted");
            refetchKris();
        }
    });

    const handleOpenKriDialog = (kri?: any) => {
        if (kri) {
            setEditingKri(kri);
            setKriFormData({
                name: kri.name,
                description: kri.description || "",
                thresholdGreen: kri.thresholdGreen || "",
                thresholdAmber: kri.thresholdAmber || "",
                thresholdRed: kri.thresholdRed || "",
                currentValue: kri.currentValue || "",
                currentStatus: kri.currentStatus || "green"
            });
        } else {
            setEditingKri(null);
            setKriFormData({
                name: "",
                description: "",
                thresholdGreen: "",
                thresholdAmber: "",
                thresholdRed: "",
                currentValue: "",
                currentStatus: "green"
            });
        }
        setIsKriDialogOpen(true);
    };

    const handleSaveKri = () => {
        if (editingKri) {
            updateKriMutation.mutate({
                id: editingKri.id,
                ...kriFormData
            });
        } else {
            createKriMutation.mutate({
                clientId,
                ...kriFormData
            });
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="mb-2">
                            <Link href={`/clients/${clientId}/risks`}>
                                <Button variant="ghost" size="sm" className="pl-0 gap-1 text-muted-foreground hover:text-foreground">
                                    <ChevronLeft className="w-4 h-4" />
                                    Back to Dashboard
                                </Button>
                            </Link>
                        </div>
                        <Breadcrumb
                            items={[
                                { label: "Client Workspace", href: `/clients/${clientId}` },
                                { label: "Risk Management", href: `/clients/${clientId}/risks` },
                                { label: "Risk Framework" },
                            ]}
                        />
                    </div>
                    <Button onClick={handleSave} disabled={updateMutation.isPending}>
                        {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                    </Button>
                </div>

                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Risk Management Framework</h1>
                    <p className="text-muted-foreground">Define the scope, context, and criteria for managing risks.</p>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 text-sm text-black dark:bg-blue-900/10 dark:text-blue-200 dark:border-blue-900/30">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-black shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-medium text-black">About Risk Management Framework</p>
                            <p className="text-black">
                                Establishing a robust framework is the first step in the ISO 27005 risk management process.
                                Use this page to define <strong>Context</strong> (internal/external factors), set your <strong>Risk Appetite</strong> (acceptable risk levels),
                                and customize the <strong>Criteria</strong> used to score risks (Impact & Likelihood).
                                This ensures all subsequent risk assessments are consistent and aligned with organizational objectives.
                            </p>
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="scope">Scope & Context</TabsTrigger>
                        <TabsTrigger value="appetite">Risk Appetite</TabsTrigger>
                        <TabsTrigger value="criteria">Risk Criteria</TabsTrigger>
                        <TabsTrigger value="kris">Key Risk Indicators</TabsTrigger>
                        <TabsTrigger value="stakeholders">Key Stakeholders</TabsTrigger>
                    </TabsList>

                    <TabsContent value="scope" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Risk Management Scope</CardTitle>
                                <CardDescription>
                                    Define the boundaries of the risk management process. What assets, processes, and locations are included?
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 mb-12">
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.scope}
                                        onChange={(val) => setFormData(prev => ({ ...prev, scope: val }))}
                                        className="h-48"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Context (Internal & External)</CardTitle>
                                <CardDescription>
                                    Describe the internal and external issues that affect the organization's ability to achieve its objectives.
                                    (e.g., regulatory environment, market conditions, internal culture).
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 mb-12">
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.context}
                                        onChange={(val) => setFormData(prev => ({ ...prev, context: val }))}
                                        className="h-48"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Methodology</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label>Risk Methodology Framework</Label>
                                    <Input
                                        value={formData.methodology}
                                        onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                                    />
                                    <p className="text-sm text-muted-foreground">e.g., ISO 27005, NIST SP 800-30</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="appetite" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Risk Appetite Statement</CardTitle>
                                <CardDescription>
                                    Define the amount and type of risk that the organization is willing to pursue or retain.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-96 mb-12">
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.riskAppetite}
                                        onChange={(val) => setFormData(prev => ({ ...prev, riskAppetite: val }))}
                                        className="h-80"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="flex flex-col space-y-1.5">
                                    <CardTitle>Defined Risk Tolerances</CardTitle>
                                    <CardDescription>
                                        Specific thresholds for different categories of risk (e.g., Financial Loss &lt; $10k).
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setRiskTolerance([...riskTolerance, { category: "", threshold: "", unit: "" }])}
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Add Tolerance
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {riskTolerance.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-12 gap-4 font-medium text-sm text-muted-foreground px-1">
                                            <div className="col-span-4">Category</div>
                                            <div className="col-span-4">Threshold</div>
                                            <div className="col-span-3">Unit/Metric</div>
                                        </div>
                                        {riskTolerance.map((item, index) => (
                                            <div key={index} className="grid grid-cols-12 gap-4 items-center">
                                                <div className="col-span-4">
                                                    <Input
                                                        placeholder="e.g. Financial, Reputation"
                                                        value={item.category}
                                                        onChange={(e) => {
                                                            const newTol = [...riskTolerance];
                                                            newTol[index].category = e.target.value;
                                                            setRiskTolerance(newTol);
                                                        }}
                                                    />
                                                </div>
                                                <div className="col-span-4">
                                                    <Input
                                                        placeholder="e.g. 500,000"
                                                        value={item.threshold}
                                                        onChange={(e) => {
                                                            const newTol = [...riskTolerance];
                                                            newTol[index].threshold = e.target.value;
                                                            setRiskTolerance(newTol);
                                                        }}
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <Input
                                                        placeholder="e.g. USD, Hours"
                                                        value={item.unit}
                                                        onChange={(e) => {
                                                            const newTol = [...riskTolerance];
                                                            newTol[index].unit = e.target.value;
                                                            setRiskTolerance(newTol);
                                                        }}
                                                    />
                                                </div>
                                                <div className="col-span-1 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-muted-foreground hover:text-destructive"
                                                        onClick={() => {
                                                            const newTol = riskTolerance.filter((_, i) => i !== index);
                                                            setRiskTolerance(newTol);
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50/50">
                                        <p>No specific risk tolerances defined.</p>
                                        <Button variant="link" onClick={() => setRiskTolerance([...riskTolerance, { category: "", threshold: "", unit: "" }])}>
                                            Add your first tolerance threshold
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="criteria" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex flex-col space-y-1.5">
                                        <CardTitle>Impact Criteria</CardTitle>
                                        <CardDescription>Scale 1-5 (Low to High)</CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const newLevel = impactCriteria.length + 1;
                                            setImpactCriteria([...impactCriteria, { level: newLevel, name: "", description: "" }]);
                                        }}
                                    >
                                        <Plus className="w-4 h-4 mr-1" /> Add Level
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {impactCriteria.sort((a, b) => a.level - b.level).map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-start border-b pb-2 last:border-0">
                                            <div className="col-span-1 pt-2 font-bold text-center bg-muted rounded mx-1 h-9 flex items-center justify-center">
                                                {item.level}
                                            </div>
                                            <div className="col-span-4">
                                                <Input
                                                    value={item.name}
                                                    onChange={(e) => {
                                                        const newCriteria = impactCriteria.map((c, i) =>
                                                            i === index ? { ...c, name: e.target.value } : c
                                                        );
                                                        setImpactCriteria(newCriteria);
                                                    }}
                                                    placeholder="Name (e.g. Critical)"
                                                />
                                            </div>
                                            <div className="col-span-6">
                                                <Textarea
                                                    value={item.description}
                                                    onChange={(e) => {
                                                        const newCriteria = impactCriteria.map((c, i) =>
                                                            i === index ? { ...c, description: e.target.value } : c
                                                        );
                                                        setImpactCriteria(newCriteria);
                                                    }}
                                                    placeholder="Description"
                                                    className="h-9 min-h-[36px] py-2"
                                                />
                                            </div>
                                            <div className="col-span-1 pt-0.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => {
                                                        const newCriteria = impactCriteria.filter((_, i) => i !== index);
                                                        setImpactCriteria(newCriteria);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {impactCriteria.length === 0 && (
                                        <div className="text-center py-4 text-muted-foreground text-sm">
                                            No impact levels defined. Click "Add Level" to start.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex flex-col space-y-1.5">
                                        <CardTitle>Likelihood Criteria</CardTitle>
                                        <CardDescription>Scale 1-5 (Rare to Almost Certain)</CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const newLevel = likelihoodCriteria.length + 1;
                                            setLikelihoodCriteria([...likelihoodCriteria, { level: newLevel, name: "", description: "" }]);
                                        }}
                                    >
                                        <Plus className="w-4 h-4 mr-1" /> Add Level
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {likelihoodCriteria.sort((a, b) => a.level - b.level).map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-start border-b pb-2 last:border-0">
                                            <div className="col-span-1 pt-2 font-bold text-center bg-muted rounded mx-1 h-9 flex items-center justify-center">
                                                {item.level}
                                            </div>
                                            <div className="col-span-4">
                                                <Input
                                                    value={item.name}
                                                    onChange={(e) => {
                                                        const newCriteria = likelihoodCriteria.map((c, i) =>
                                                            i === index ? { ...c, name: e.target.value } : c
                                                        );
                                                        setLikelihoodCriteria(newCriteria);
                                                    }}
                                                    placeholder="Name"
                                                />
                                            </div>
                                            <div className="col-span-6">
                                                <Textarea
                                                    value={item.description}
                                                    onChange={(e) => {
                                                        const newCriteria = likelihoodCriteria.map((c, i) =>
                                                            i === index ? { ...c, description: e.target.value } : c
                                                        );
                                                        setLikelihoodCriteria(newCriteria);
                                                    }}
                                                    placeholder="Description"
                                                    className="h-9 min-h-[36px] py-2"
                                                />
                                            </div>
                                            <div className="col-span-1 pt-0.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => {
                                                        const newCriteria = likelihoodCriteria.filter((_, i) => i !== index);
                                                        setLikelihoodCriteria(newCriteria);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {likelihoodCriteria.length === 0 && (
                                        <div className="text-center py-4 text-muted-foreground text-sm">
                                            No likelihood levels defined. Click "Add Level" to start.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Risk Heatmap */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Risk Heatmap</CardTitle>
                                <CardDescription>
                                    Visual representation of risk levels based on your criteria.
                                    (Likelihood × Impact)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center justify-center p-4">
                                    <div className="relative">
                                        {/* Y-Axis Label */}
                                        <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 font-bold text-sm text-muted-foreground whitespace-nowrap">
                                            Likelihood
                                        </div>

                                        {/* Grid Container */}
                                        <div className="flex flex-col gap-1">
                                            {likelihoodCriteria.sort((a, b) => b.level - a.level).map((l, yIndex) => (
                                                <div key={l.level} className="flex gap-1.5 items-center">
                                                    {/* Y-Axis Row Label */}
                                                    <div className="w-24 text-right pr-3 text-sm font-semibold text-muted-foreground truncate" title={l.name}>
                                                        {l.name || `L${l.level}`}
                                                    </div>

                                                    {/* Cells */}
                                                    {impactCriteria.sort((a, b) => a.level - b.level).map((i, xIndex) => {
                                                        const score = l.level * i.level;
                                                        const maxScore = (likelihoodCriteria.length || 5) * (impactCriteria.length || 5);

                                                        // Brighter, more vibrant colors
                                                        let bgColor = "bg-emerald-500 text-white shadow-sm border-emerald-600/20";
                                                        if (score > maxScore * 0.6) bgColor = "bg-rose-600 text-white shadow-sm border-rose-700/20";
                                                        else if (score > maxScore * 0.3) bgColor = "bg-amber-400 text-black shadow-sm border-amber-500/20";

                                                        return (
                                                            <div
                                                                key={`${l.level}-${i.level}`}
                                                                className={`
                                                                    w-24 h-16 flex items-center justify-center rounded-md text-xl font-bold transition-all hover:scale-105 hover:shadow-md cursor-default border
                                                                    ${bgColor}
                                                                `}
                                                                title={`Likelihood: ${l.name}\nImpact: ${i.name}\nScore: ${score}`}
                                                            >
                                                                {score}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>

                                        {/* X-Axis Labels */}
                                        <div className="flex gap-1.5 ml-[100px] mt-3">
                                            {impactCriteria.sort((a, b) => a.level - b.level).map((i) => (
                                                <div key={i.level} className="w-24 text-center text-sm font-semibold text-muted-foreground truncate" title={i.name}>
                                                    {i.name || `I${i.level}`}
                                                </div>
                                            ))}
                                        </div>

                                        {/* X-Axis Label */}
                                        <div className="text-center font-bold text-sm text-muted-foreground mt-2 ml-[100px]">
                                            Impact
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="kris" className="space-y-4">
                        <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                            <div>
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-purple-600" />
                                    Key Risk Indicators (KRIs)
                                </h2>
                                <p className="text-sm text-muted-foreground">Monitor leading indicators to predict potential risks.</p>
                            </div>
                            <Button onClick={() => handleOpenKriDialog()}><Plus className="mr-2 h-4 w-4" /> Add KRI</Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {kris?.map(kri => (
                                <Card key={kri.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start gap-2">
                                            <CardTitle className="text-base font-bold leading-tight">{kri.name}</CardTitle>
                                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0 ${kri.currentStatus === 'green' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                kri.currentStatus === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    'bg-rose-50 text-rose-700 border-rose-200'
                                                }`}>
                                                {kri.currentStatus}
                                            </div>
                                        </div>
                                        {kri.description && <CardDescription className="line-clamp-2 text-xs">{kri.description}</CardDescription>}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4 text-sm">
                                            <div className="flex justify-between items-center border-b pb-2 border-dashed">
                                                <span className="text-muted-foreground text-xs">Current Value</span>
                                                <span className="font-mono font-bold">{kri.currentValue || "N/A"}</span>
                                            </div>

                                            <div className="space-y-1.5">
                                                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Thresholds</div>
                                                <div className="grid grid-cols-3 gap-1 text-[10px] text-center">
                                                    <div className="bg-emerald-50/50 p-1.5 rounded border border-emerald-100 text-emerald-900">
                                                        <div className="font-bold text-emerald-600 mb-0.5">Green</div>
                                                        {kri.thresholdGreen || "-"}
                                                    </div>
                                                    <div className="bg-amber-50/50 p-1.5 rounded border border-amber-100 text-amber-900">
                                                        <div className="font-bold text-amber-600 mb-0.5">Amber</div>
                                                        {kri.thresholdAmber || "-"}
                                                    </div>
                                                    <div className="bg-rose-50/50 p-1.5 rounded border border-rose-100 text-rose-900">
                                                        <div className="font-bold text-rose-600 mb-0.5">Red</div>
                                                        {kri.thresholdRed || "-"}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                                                <Button variant="ghost" size="sm" onClick={() => handleOpenKriDialog(kri)} className="h-7 w-7 p-0"><Edit2 className="h-3.5 w-3.5" /></Button>
                                                <Button variant="ghost" size="sm" onClick={() => { if (confirm('Delete KRI?')) deleteKriMutation.mutate({ id: kri.id }) }} className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {(!kris || kris.length === 0) && (
                                <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50/50">
                                    <Activity className="h-12 w-12 opacity-20 mb-3" />
                                    <p className="font-medium">No Key Risk Indicators defined</p>
                                    <p className="text-sm opacity-70 mb-4">Add metric-driven indicators to monitor risk exposure.</p>
                                    <Button variant="outline" onClick={() => handleOpenKriDialog()}>Create First KRI</Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="stakeholders" className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                            <div>
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    Key Stakeholders
                                </h2>
                                <p className="text-sm text-muted-foreground">Internal and external parties relevant to risk management.</p>
                            </div>
                            <Button onClick={() => setIsStakeholderDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Add Stakeholder
                            </Button>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Stakeholder Registry</CardTitle>
                                <CardDescription>Consolidated list of employees, client contacts, and third parties.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Role / Job Title</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stakeholders?.map((stakeholder) => (
                                            <TableRow key={stakeholder.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                                            {stakeholder.firstName?.[0]}{stakeholder.lastName?.[0]}
                                                        </div>
                                                        <div>
                                                            {stakeholder.firstName} {stakeholder.lastName}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{stakeholder.jobTitle || stakeholder.role || "-"}</TableCell>
                                                <TableCell>
                                                    <Badge variant={stakeholder.type === 'internal' ? 'default' : 'secondary'}>
                                                        {stakeholder.source === 'employee' ? 'Internal' :
                                                            stakeholder.source === 'vendor_contact' ? 'Vendor' : 'External'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {stakeholder.email && (
                                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                            <Mail className="w-3 h-3" />
                                                            {stakeholder.email}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>{stakeholder.department || "-"}</TableCell>
                                                <TableCell>
                                                    {stakeholder.id.startsWith('cc-') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                            onClick={() => {
                                                                if (confirm("Are you sure you want to delete this stakeholder?")) {
                                                                    deleteStakeholderMutation.mutate({ id: stakeholder.id, clientId });
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!stakeholders || stakeholders.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    No stakeholders found using the current criteria.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <EnhancedDialog
                        open={isStakeholderDialogOpen}
                        onOpenChange={setIsStakeholderDialogOpen}
                        title="Add Stakeholder"
                        description="Add an external stakeholder to this client."
                        size="md"
                        footer={
                            <div className="flex justify-end gap-2 w-full">
                                <Button variant="outline" onClick={() => setIsStakeholderDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleSaveStakeholder} disabled={createStakeholderMutation.isPending}>
                                    {createStakeholderMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Add Stakeholder
                                </Button>
                            </div>
                        }
                    >
                        <div className="grid gap-4 py-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>First Name</Label>
                                    <Input
                                        value={stakeholderFormData.firstName}
                                        onChange={(e) => setStakeholderFormData({ ...stakeholderFormData, firstName: e.target.value })}
                                        placeholder="Jane"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Last Name</Label>
                                    <Input
                                        value={stakeholderFormData.lastName}
                                        onChange={(e) => setStakeholderFormData({ ...stakeholderFormData, lastName: e.target.value })}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Email</Label>
                                <Input
                                    value={stakeholderFormData.email}
                                    onChange={(e) => setStakeholderFormData({ ...stakeholderFormData, email: e.target.value })}
                                    placeholder="jane.doe@example.com"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Role / Title</Label>
                                    <Input
                                        value={stakeholderFormData.role}
                                        onChange={(e) => setStakeholderFormData({ ...stakeholderFormData, role: e.target.value })}
                                        placeholder="e.g. External Auditor"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Department / Organization</Label>
                                    <Input
                                        value={stakeholderFormData.department}
                                        onChange={(e) => setStakeholderFormData({ ...stakeholderFormData, department: e.target.value })}
                                        placeholder="e.g. Audit Firm LLP"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Phone Number</Label>
                                <Input
                                    value={stakeholderFormData.phone}
                                    onChange={(e) => setStakeholderFormData({ ...stakeholderFormData, phone: e.target.value })}
                                    placeholder="e.g. +1 (555) 000-0000"
                                />
                            </div>
                        </div>
                    </EnhancedDialog>
                </Tabs>

                {/* KRI Dialog */}
                <EnhancedDialog
                    open={isKriDialogOpen}
                    onOpenChange={setIsKriDialogOpen}
                    title={editingKri ? "Edit Key Risk Indicator" : "Add Key Risk Indicator"}
                    description="Define a metric to monitor risk exposure."
                    size="md"
                    footer={
                        <div className="flex justify-end gap-2 w-full">
                            <Button variant="outline" onClick={() => setIsKriDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveKri} disabled={createKriMutation.isPending || updateKriMutation.isPending}>
                                {(createKriMutation.isPending || updateKriMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save KRI
                            </Button>
                        </div>
                    }
                >
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label>KRI Name</Label>
                            <Input
                                value={kriFormData.name}
                                onChange={(e) => setKriFormData({ ...kriFormData, name: e.target.value })}
                                placeholder="e.g. Mean Time to Patch (MTTP)"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea
                                value={kriFormData.description}
                                onChange={(e) => setKriFormData({ ...kriFormData, description: e.target.value })}
                                placeholder="What does this indicator measure?"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-emerald-600">Green Threshold</Label>
                                <Input
                                    value={kriFormData.thresholdGreen}
                                    onChange={(e) => setKriFormData({ ...kriFormData, thresholdGreen: e.target.value })}
                                    placeholder="< 7 days"
                                    className="border-emerald-200 focus-visible:ring-emerald-500"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-amber-600">Amber Threshold</Label>
                                <Input
                                    value={kriFormData.thresholdAmber}
                                    onChange={(e) => setKriFormData({ ...kriFormData, thresholdAmber: e.target.value })}
                                    placeholder="7 - 30 days"
                                    className="border-amber-200 focus-visible:ring-amber-500"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-rose-600">Red Threshold</Label>
                                <Input
                                    value={kriFormData.thresholdRed}
                                    onChange={(e) => setKriFormData({ ...kriFormData, thresholdRed: e.target.value })}
                                    placeholder="> 30 days"
                                    className="border-rose-200 focus-visible:ring-rose-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                            <div className="grid gap-2">
                                <Label>Current Value</Label>
                                <Input
                                    value={kriFormData.currentValue}
                                    onChange={(e) => setKriFormData({ ...kriFormData, currentValue: e.target.value })}
                                    placeholder="e.g. 5 days"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Current Status</Label>
                                <Select
                                    value={kriFormData.currentStatus}
                                    onValueChange={(val) => setKriFormData({ ...kriFormData, currentStatus: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="green">Within Tolerance (Green)</SelectItem>
                                        <SelectItem value="amber">Warning (Amber)</SelectItem>
                                        <SelectItem value="red">Critical (Red)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </EnhancedDialog>
            </div>
        </DashboardLayout>
    );
}
