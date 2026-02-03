
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Badge } from "@complianceos/ui/ui/badge";
import { Plus, X, ArrowRight, ArrowLeft, Target, TrendingUp, Shield, CheckCircle2, Calendar as CalendarIcon, Flag, LayoutDashboard, Database, Building2, Scale, AlertTriangle, Clock, DollarSign, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar } from "@complianceos/ui/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@complianceos/ui/ui/popover";
import { cn } from "@/lib/utils";
import { Separator } from "@complianceos/ui/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@complianceos/ui/ui/accordion";
import { Slider } from "@complianceos/ui/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@complianceos/ui/ui/dialog";

interface RoadmapCreateProps {
    clientId: number;
    initialData?: any;
    onSuccess?: (roadmap: any) => void;
    onCancel?: () => void;
}

interface RoadmapObjective {
    id: string;
    title: string;
    alignment: string; // Links to a Business Goal
    priority: "Critical" | "High" | "Medium" | "Low";
    horizon: string;
    owner: string;
    // Phase 3: Resource & ROI Modeling
    estimatedHours?: number;
    budget?: number;
    complexity?: "High" | "Medium" | "Low";
    // Phase 3: Risk Integration
    linkedRisks?: string[];
    // Additional details
    description?: string;
}

// Phase 2: Expanded State Interfaces
interface BusinessContext {
    goals: string[]; // e.g. "Digital Transformation", "IPO Readiness"
    industry: string;
    orgSize: string;
    riskAppetite: number; // 1-5 (Very Low to High)
}

interface RoadmapMetric {
    id: string;
    name: string;
    type: "Percentage" | "Currency" | "Count" | "Boolean";
    targetValue: number;
    frequency: "Monthly" | "Quarterly" | "Annually";
}

interface GovernanceStructure {
    reviewCadence: "Weekly" | "Monthly" | "Quarterly";
    oversightCommittee: string;
    reportingFormat: "Dashboard" | "Slide Deck" | "Report";
}

interface ComplianceDrivers {
    frameworks: string[];
    deadline?: Date;
    auditType: string; // e.g. "Initial Certification", "Surveillance", "Internal"
}

interface SecurityPosture {
    maturityLevel: string; // "Initial" | "Managed" | "Defined" | "Quantitative" | "Optimizing"
    keyAssets: string[]; // e.g. "Customer PII", "Source Code"
    recentIncidents: string;
}

export default function RoadmapCreateForm({ clientId, initialData, onSuccess, onCancel }: RoadmapCreateProps) {
    const [step, setStep] = useState(1);

    // Fetch Client Context for Smart Defaults
    const { data: client } = trpc.clients.get.useQuery({ id: clientId }, {
        enabled: !initialData, // Only fetch if not editing existing
        refetchOnWindowFocus: false
    });

    // Step 1 State - Strategic Vision
    const [title, setTitle] = useState(initialData?.title || "");
    const [businessContext, setBusinessContext] = useState<BusinessContext>({
        goals: initialData?.vision ? [initialData.vision] : [],
        industry: initialData?.industry || "tech",
        orgSize: initialData?.orgSize || "mid",
        riskAppetite: initialData?.riskAppetite || 3
    });
    const [drivers, setDrivers] = useState<ComplianceDrivers>({
        frameworks: initialData?.framework ? [initialData.framework] : [],
        deadline: initialData?.deadline,
        auditType: initialData?.auditType || 'readiness'
    });

    // Validated Effect: Populate form with Client Data once loaded
    React.useEffect(() => {
        if (client && !initialData) {
            setBusinessContext(prev => ({
                ...prev,
                industry: client.industry || "",
                orgSize: client.size || "",
                // Heuristic mapping of risk appetite if not stored directly
                riskAppetite: 3
            }));

            // Map active modules/context to frameworks
            // If client has 'policyLanguage' or other hints, we could use them.
            // For now, simpler mapping:
            if (client.industry === 'Cybersecurity' || client.industry === 'Tech') {
                setDrivers(prev => ({ ...prev, frameworks: [...prev.frameworks, "ISO 27001:2022"] }));
            }
        }
    }, [client, initialData]);
    const [posture, setPosture] = useState<SecurityPosture>({
        maturityLevel: initialData?.maturityLevel || "Initial",
        keyAssets: initialData?.keyAssets || [],
        recentIncidents: initialData?.recentIncidents || ""
    });

    // Step 2 & 3 State (Placeholder for now, keeping existing logic stable till next steps)
    const [vision, setVision] = useState(initialData?.vision || ""); // Keeping for backward compat or summary
    const [description, setDescription] = useState(initialData?.description || "");
    // Step 2 State - Objectives
    const [objectives, setObjectives] = useState<RoadmapObjective[]>(() => {
        console.log("Initializing objectives from initialData:", initialData);
        if (initialData?.detailedObjectives) {
            console.log("Using detailedObjectives:", initialData.detailedObjectives);
            return initialData.detailedObjectives;
        }
        if (initialData?.objectives && Array.isArray(initialData.objectives)) {
            console.log("Creating objectives from string array:", initialData.objectives);
            return initialData.objectives.map((title: string) => ({
                id: crypto.randomUUID(),
                title,
                alignment: initialData.vision || "",
                priority: "High",
                horizon: "Q1",
                owner: "TBD",
                estimatedHours: 40, // Default estimate
                budget: 0,
                complexity: "Medium"
            }));
        }
        console.log("No initial objectives, returning empty array");
        return [];
    });

    // Step 3 State
    const [metrics, setMetrics] = useState<RoadmapMetric[]>(() => {
        if (initialData?.metrics) return initialData.metrics;
        if (initialData?.kpiTargets && Array.isArray(initialData.kpiTargets)) {
            return initialData.kpiTargets.map((kpi: any) => ({
                id: crypto.randomUUID(),
                name: kpi.name,
                type: kpi.unit === '%' ? 'Percentage' : 'Count',
                targetValue: kpi.target,
                frequency: 'Quarterly'
            }));
        }
        return [];
    });
    const [governance, setGovernance] = useState<GovernanceStructure>({
        reviewCadence: initialData?.reviewCadence || "Monthly",
        oversightCommittee: initialData?.oversightCommittee || "",
        reportingFormat: initialData?.reportingFormat || "Dashboard"
    });

    // Step 3 Form State
    const [newMetric, setNewMetric] = useState<RoadmapMetric>({
        id: "",
        name: "",
        type: "Percentage",
        targetValue: 0,
        frequency: "Monthly"
    });

    // Temp state for adding risks to an objective
    const [tempObjRisk, setTempObjRisk] = useState("");

    const addObjRisk = () => {
        if (tempObjRisk && (!newObj.linkedRisks || !newObj.linkedRisks.includes(tempObjRisk))) {
            setNewObj({
                ...newObj,
                linkedRisks: [...(newObj.linkedRisks || []), tempObjRisk]
            });
            setTempObjRisk("");
        }
    };

    const removeObjRisk = (risk: string) => {
        setNewObj({
            ...newObj,
            linkedRisks: (newObj.linkedRisks || []).filter(r => r !== risk)
        });
    }

    const handleAddMetric = () => {
        if (!newMetric.name) return;
        setMetrics([...metrics, { ...newMetric, id: crypto.randomUUID() }]);
        setNewMetric({
            id: "",
            name: "",
            type: "Percentage",
            targetValue: 0,
            frequency: "Monthly"
        });
    };

    const handleRemoveMetric = (id: string) => {
        setMetrics(metrics.filter(m => m.id !== id));
    };

    const createMutation = trpc.roadmap.createStrategic.useMutation({
        onSuccess: (data) => {
            toast.success(initialData?.id ? "Roadmap updated successfully!" : "Strategic Roadmap created successfully!");
            if (onSuccess) onSuccess(data);
        },
        onError: (err) => {
            toast.error("Failed to create roadmap: " + err.message);
        }
    });

    // Step 2 Form State
    const [newObj, setNewObj] = useState<RoadmapObjective>({
        id: "",
        title: "",
        alignment: "none",
        priority: "Medium",
        horizon: "Q1",
        owner: "",
        linkedRisks: [],
        description: ""
    });
    
    // Dialog state for editing objectives
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingObjective, setEditingObjective] = useState<RoadmapObjective | null>(null);
    
    // Dialog state for editing metrics
    const [editMetricDialogOpen, setEditMetricDialogOpen] = useState(false);
    const [editingMetric, setEditingMetric] = useState<RoadmapMetric | null>(null);

    const handleAddObjective = () => {
        if (!newObj.title) return;
        
        // Add new objective (inline form)
        setObjectives([...objectives, { ...newObj, id: crypto.randomUUID() }]);
        
        // Reset form
        setNewObj({
            id: "",
            title: "",
            alignment: "none",
            priority: "Medium",
            horizon: "Q1",
            owner: "",
            linkedRisks: [],
            description: ""
        });
    };

    const handleEditObjective = (objective: RoadmapObjective) => {
        console.log("Opening edit dialog for objective:", objective);
        setEditingObjective(objective);
        setTempObjRisk(""); // Clear any existing temp risk
        setEditDialogOpen(true);
    };

    const handleSaveEditedObjective = () => {
        if (!editingObjective) return;
        
        console.log("Saving edited objective:", editingObjective);
        console.log("Current objectives before update:", objectives);
        
        // Update the objective in the list
        const updatedObjectives = objectives.map(obj => 
            obj.id === editingObjective.id ? editingObjective : obj
        );
        
        console.log("Objectives after update:", updatedObjectives);
        setObjectives(updatedObjectives);
        
        // Close dialog and reset
        setEditDialogOpen(false);
        setEditingObjective(null);
        setTempObjRisk(""); // Clear temp risk
    };

    const handleCancelEdit = () => {
        setEditDialogOpen(false);
        setEditingObjective(null);
        setTempObjRisk(""); // Clear temp risk
    };

    // Metric edit handlers
    const handleEditMetric = (metric: RoadmapMetric) => {
        console.log("Opening edit dialog for metric:", metric);
        setEditingMetric(metric);
        setEditMetricDialogOpen(true);
    };

    const handleSaveEditedMetric = () => {
        if (!editingMetric) return;
        
        console.log("Saving edited metric:", editingMetric);
        console.log("Current metrics before update:", metrics);
        
        // Update the metric in the list
        const updatedMetrics = metrics.map(m => 
            m.id === editingMetric.id ? editingMetric : m
        );
        
        console.log("Metrics after update:", updatedMetrics);
        setMetrics(updatedMetrics);
        
        // Close dialog and reset
        setEditMetricDialogOpen(false);
        setEditingMetric(null);
    };

    const handleCancelMetricEdit = () => {
        setEditMetricDialogOpen(false);
        setEditingMetric(null);
    };

    const handleRemoveObjective = (id: string) => {
        setObjectives(objectives.filter(o => o.id !== id));
        // If we're removing an objective that's being edited in the dialog, close dialog
        if (editingObjective?.id === id) {
            handleCancelEdit();
        }
    };

    // Helper functions for Step 1
    const handleAddGoal = (goal: string) => {
        if (goal && !businessContext.goals.includes(goal)) {
            setBusinessContext(prev => ({ ...prev, goals: [...prev.goals, goal] }));
        }
    };
    const handleRemoveGoal = (goal: string) => {
        setBusinessContext(prev => ({ ...prev, goals: prev.goals.filter(g => g !== goal) }));
    };

    const handleAddFramework = (fw: string) => {
        if (fw && !drivers.frameworks.includes(fw)) {
            setDrivers(prev => ({ ...prev, frameworks: [...prev.frameworks, fw] }));
        }
    };
    const handleRemoveFramework = (fw: string) => {
        setDrivers(prev => ({ ...prev, frameworks: prev.frameworks.filter(f => f !== fw) }));
    };

    // Existing helpers
    // (KPI helpers removed in favor of new Metrics logic)

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSubmit = () => {
        if (!title || objectives.length === 0) {
            toast.error("Please provide a title and at least one objective.");
            return;
        }

        // Construct complex payload mapping back to backend expectation
        // Note: Backend might need updates to accept all this new data.
        // For now, we pack it into 'vision' and 'description' or custom JSON fields if available.
        // Assuming we just map relevant parts for now until backend is updated.
        const packedVision = `
GOALS: ${businessContext.goals.join(", ")}
INDUSTRY: ${businessContext.industry}
RISK_APPETITE: ${businessContext.riskAppetite}/5
MATURITY: ${posture.maturityLevel}
        `.trim();

        createMutation.mutate({
            clientId,
            roadmapId: initialData?.id, // Pass roadmap ID for updates
            title,
            vision: packedVision, // Temporary packing
            description: JSON.stringify({
                drivers,
                posture,
                businessContext,
                detailedObjectives: objectives, // Include detailed objectives
                metrics,
                governance
            }),
            objectives: objectives.map(o => o.title || ''), // Send as array of strings for backend compatibility
            framework: drivers.frameworks?.[0] || '',
            targetDate: drivers.deadline,
            kpiTargets: metrics.filter(m => m.name && m.targetValue !== undefined).map(m => ({
                name: m.name || '',
                target: m.targetValue || 0,
                unit: m.type === 'Percentage' ? '%' : m.type === 'Currency' ? '$' : (m.type ? m.type.toLowerCase() : 'count')
            }))
        });
    };

    const steps = [
        { number: 1, title: "Strategic Context", icon: Target, description: "Vision, Drivers & Posture" },
        { number: 2, title: "Key Objectives", icon: Flag, description: "Define actionable milestones" },
        { number: 3, title: "Execution & Governance", icon: TrendingUp, description: "Targets, budget & oversight" },
        { number: 4, title: "Preview & Finalize", icon: CheckCircle2, description: "Review and generate roadmap" }
    ];

    // Temp input state for adding lists
    const [tempGoal, setTempGoal] = useState("");
    const [tempFramework, setTempFramework] = useState("");
    const [tempAsset, setTempAsset] = useState("");

    // Debug: log when objectives change
    React.useEffect(() => {
        console.log("Objectives state updated:", objectives);
    }, [objectives]);

    const addAsset = () => {
        if (tempAsset && !posture.keyAssets.includes(tempAsset)) {
            setPosture(prev => ({ ...prev, keyAssets: [...prev.keyAssets, tempAsset] }));
            setTempAsset("");
        }
    }

    return (
        <>
            <div className="flex gap-8 w-full items-start font-sans">
            {/* Left Sidebar - Stepper */}
            <Card className="w-80 shrink-0 border-none shadow-none bg-transparent">
                <div className="space-y-8 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-border -z-10" />

                    {steps.map((s) => {
                        const isActive = step === s.number;
                        const isCompleted = step > s.number;
                        const Icon = s.icon;

                        return (
                            <div
                                key={s.number}
                                className="flex gap-4 items-start group cursor-pointer"
                                onClick={() => setStep(s.number)}
                            >
                                <div className={cn(
                                    "relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-background",
                                    isActive ? "border-primary text-primary shadow-[0_0_0_4px_rgba(var(--primary),0.1)]" :
                                        isCompleted ? "border-primary bg-primary text-primary-foreground" :
                                            "border-muted-foreground/30 text-muted-foreground"
                                )}>
                                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <div className={cn(
                                    "pt-1 transition-colors duration-300",
                                    isActive ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    <h3 className="font-semibold text-sm leading-none mb-1.5 uppercase tracking-wide">
                                        {s.title}
                                    </h3>
                                    <p className="text-xs max-w-[180px] leading-relaxed">
                                        {s.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Main Content */}
            <Card className="flex-1 card-enhanced card-accent-left accent-info animate-in slide-in-from-right-4 duration-500">
                <CardHeader className="border-b pb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 uppercase tracking-widest text-[10px] font-bold px-2 py-0.5">
                                    Step {step} of 4
                                </Badge>
                                <Badge variant="secondary" className="text-[10px] font-medium text-muted-foreground">Phase 2: Deep Context</Badge>
                            </div>
                            <CardTitle className="text-2xl font-bold tracking-tight">
                                {step === 1 && "Strategic Context & Vision"}
                                {step === 2 && "Outline Core Objectives"}
                                {step === 3 && "Metrics & Governance"}
                                {step === 4 && "Final Review"}
                            </CardTitle>
                            <CardDescription className="text-base mt-2">
                                {step === 1 && "Establish the 'Why' - Define business goals, compliance drivers, and current security posture."}
                                {step === 2 && "Break down the vision into actionable, tactical objectives."}
                                {step === 3 && "Set measurable targets, define ownership, and establish governance."}
                                {step === 4 && "Review your strategic roadmap before finalizing."}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 min-h-[400px]">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                            {/* Roadmap Title - Always Visible */}
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Roadmap Title <span className="text-destructive">*</span></Label>
                                <Input
                                    placeholder="e.g. FY26 Enterprise Security Transformation"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-12 text-base font-medium bg-muted/30 border-input transition-colors focus:bg-background"
                                    autoFocus
                                />
                            </div>

                            <Accordion type="single" collapsible defaultValue="context" className="w-full space-y-4">

                                {/* 1. Business & Organizational Context */}
                                <AccordionItem value="context" className="border rounded-lg bg-card px-4">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-md bg-primary/10 text-primary">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-semibold text-sm">Organizational Context</h4>
                                                <p className="text-xs text-muted-foreground font-normal">Business goals, industry, and risk appetite</p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-6 space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Industry Sector</Label>
                                                <Select onValueChange={(val) => setBusinessContext(p => ({ ...p, industry: val }))} value={businessContext.industry}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Industry" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="finance">Finance & Banking</SelectItem>
                                                        <SelectItem value="healthcare">Healthcare</SelectItem>
                                                        <SelectItem value="tech">Technology / SaaS</SelectItem>
                                                        <SelectItem value="retail">Retail & E-commerce</SelectItem>
                                                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Organization Size</Label>
                                                <Select onValueChange={(val) => setBusinessContext(p => ({ ...p, orgSize: val }))} value={businessContext.orgSize}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Size" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="sme">SME (1-50 employees)</SelectItem>
                                                        <SelectItem value="mid">Mid-Market (51-500)</SelectItem>
                                                        <SelectItem value="enterprise">Enterprise (500-5000)</SelectItem>
                                                        <SelectItem value="global">Global Enterprise (5000+)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs">Strategic Business Goals</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Add a goal (e.g. Market Expansion, Digital Transformation)"
                                                    value={tempGoal}
                                                    onChange={(e) => setTempGoal(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddGoal(tempGoal);
                                                            setTempGoal("");
                                                        }
                                                    }}
                                                />
                                                <Button size="icon" variant="outline" onClick={() => { handleAddGoal(tempGoal); setTempGoal(""); }}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 min-h-[40px]">
                                                {businessContext.goals.map(g => (
                                                    <Badge key={g} variant="secondary" className="px-3 py-1 text-xs gap-2">
                                                        {g}
                                                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleRemoveGoal(g)} />
                                                    </Badge>
                                                ))}
                                                {businessContext.goals.length === 0 && <span className="text-xs text-muted-foreground italic pl-1">No goals added yet.</span>}
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            <div className="flex justify-between">
                                                <Label className="text-xs">Risk Appetite</Label>
                                                <span className="text-xs font-bold text-primary">
                                                    {businessContext.riskAppetite === 1 && "Very Low (Averse)"}
                                                    {businessContext.riskAppetite === 2 && "Low (Conservative)"}
                                                    {businessContext.riskAppetite === 3 && "Balanced (Moderate)"}
                                                    {businessContext.riskAppetite === 4 && "High (Open)"}
                                                    {businessContext.riskAppetite === 5 && "Very High (Aggressive)"}
                                                </span>
                                            </div>
                                            <Slider
                                                value={[businessContext.riskAppetite]}
                                                min={1}
                                                max={5}
                                                step={1}
                                                onValueChange={(vals) => setBusinessContext(p => ({ ...p, riskAppetite: vals[0] }))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                                                <span>Averse</span>
                                                <span>Aggressive</span>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* 2. Compliance & Regulatory Drivers */}
                                <AccordionItem value="drivers" className="border rounded-lg bg-card px-4">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-md bg-info/10 text-info">
                                                <Scale className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-semibold text-sm">Regulatory Drivers</h4>
                                                <p className="text-xs text-muted-foreground font-normal">Frameworks, audit types, and deadlines</p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-6 space-y-6">
                                        <div className="space-y-3">
                                            <Label className="text-xs">Required Frameworks</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Add framework (e.g. SOC 2 Type II, ISO 27001:2022)"
                                                    value={tempFramework}
                                                    onChange={(e) => setTempFramework(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddFramework(tempFramework);
                                                            setTempFramework("");
                                                        }
                                                    }}
                                                />
                                                <Button size="icon" variant="outline" onClick={() => { handleAddFramework(tempFramework); setTempFramework(""); }}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 min-h-[40px]">
                                                {drivers.frameworks.map(f => (
                                                    <Badge key={f} variant="outline" className="px-3 py-1 text-xs gap-2 border-primary/20 bg-primary/5 text-primary">
                                                        {f}
                                                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleRemoveFramework(f)} />
                                                    </Badge>
                                                ))}
                                                {drivers.frameworks.length === 0 && <span className="text-xs text-muted-foreground italic pl-1">No frameworks added yet.</span>}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Audit / Assessment Type</Label>
                                                <Select onValueChange={(val) => setDrivers(p => ({ ...p, auditType: val }))} value={drivers.auditType}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="readiness">Readiness Assessment</SelectItem>
                                                        <SelectItem value="initial">Initial Certification</SelectItem>
                                                        <SelectItem value="surveillance">Surveillance Audit</SelectItem>
                                                        <SelectItem value="recertification">Re-certification</SelectItem>
                                                        <SelectItem value="internal">Internal Audit Only</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Target Deadline</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal",
                                                                !drivers.deadline && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {drivers.deadline ? format(drivers.deadline, "PPP") : <span>Pick a date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={drivers.deadline}
                                                            onSelect={(date) => setDrivers(p => ({ ...p, deadline: date }))}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* 3. Security Posture Snapshot */}
                                <AccordionItem value="posture" className="border rounded-lg bg-card px-4 border-b-0">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-md bg-warning/10 text-warning">
                                                <AlertTriangle className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-semibold text-sm">Security Posture</h4>
                                                <p className="text-xs text-muted-foreground font-normal">Current maturity and key assets</p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-6 space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Current Maturity Level (CMMI/NIST)</Label>
                                            <Select onValueChange={(val) => setPosture(p => ({ ...p, maturityLevel: val }))} value={posture.maturityLevel}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Maturity" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Initial">Tier 1: Initial / Ad-hoc</SelectItem>
                                                    <SelectItem value="Managed">Tier 2: Managed / Repeatable</SelectItem>
                                                    <SelectItem value="Defined">Tier 3: Defined Process</SelectItem>
                                                    <SelectItem value="Quantitative">Tier 4: Quantitatively Managed</SelectItem>
                                                    <SelectItem value="Optimizing">Tier 5: Optimizing</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs">Critical Assets in Scope</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Add asset (e.g. Customer PII, Payment Gateway)"
                                                    value={tempAsset}
                                                    onChange={(e) => setTempAsset(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            addAsset();
                                                        }
                                                    }}
                                                />
                                                <Button size="icon" variant="outline" onClick={addAsset}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 min-h-[40px]">
                                                {posture.keyAssets.map(a => (
                                                    <Badge key={a} variant="secondary" className="px-3 py-1 text-xs gap-2">
                                                        {a}
                                                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setPosture(p => ({ ...p, keyAssets: p.keyAssets.filter(ka => ka !== a) }))} />
                                                    </Badge>
                                                ))}
                                                {posture.keyAssets.length === 0 && <span className="text-xs text-muted-foreground italic pl-1">No major assets defined.</span>}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs">Recent Incidents or Known Risks</Label>
                                            <Textarea
                                                placeholder="Briefly describe any recent security incidents or major known risks..."
                                                value={posture.recentIncidents}
                                                onChange={(e) => setPosture(p => ({ ...p, recentIncidents: e.target.value }))}
                                                className="h-20 bg-muted/30"
                                            />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-2 mb-4">
                                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Strategic Objectives</Label>
                                <Separator className="flex-1" />
                            </div>

                            {/* Add New Objective Form */}
                            <div className="p-4 rounded-lg border bg-muted/20 space-y-4">
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-8 space-y-2">
                                        <Label className="text-xs">Objective Title</Label>
                                        <Input
                                            placeholder="e.g. Implement Zero Trust Architecture"
                                            value={newObj.title}
                                            onChange={(e) => setNewObj({ ...newObj, title: e.target.value })}
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="col-span-4 space-y-2">
                                        <Label className="text-xs">Alignment</Label>
                                        <Select value={newObj.alignment} onValueChange={(val) => setNewObj({ ...newObj, alignment: val })}>
                                            <SelectTrigger className="bg-background">
                                                <SelectValue placeholder="Align with..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No specific alignment</SelectItem>
                                                {businessContext.goals.map((g, i) => (
                                                    <SelectItem key={i} value={g}>{g}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-4 space-y-2">
                                        <Label className="text-xs">Priority</Label>
                                        <Select value={newObj.priority} onValueChange={(val: any) => setNewObj({ ...newObj, priority: val })}>
                                            <SelectTrigger className="bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Critical">Critical</SelectItem>
                                                <SelectItem value="High">High</SelectItem>
                                                <SelectItem value="Medium">Medium</SelectItem>
                                                <SelectItem value="Low">Low</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-4 space-y-2">
                                        <Label className="text-xs">Time Horizon</Label>
                                        <Select value={newObj.horizon} onValueChange={(val) => setNewObj({ ...newObj, horizon: val })}>
                                            <SelectTrigger className="bg-background">
                                                <SelectValue placeholder="Period" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Q1">Q1 (Immediate)</SelectItem>
                                                <SelectItem value="Q2">Q2 (Short Term)</SelectItem>
                                                <SelectItem value="H2">H2 (Medium Term)</SelectItem>
                                                <SelectItem value="Next Year">Next Year (Long Term)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-4 space-y-2">
                                        <Label className="text-xs">Owner</Label>
                                        <Input
                                            placeholder="e.g. CISO, IT Lead"
                                            value={newObj.owner}
                                            onChange={(e) => setNewObj({ ...newObj, owner: e.target.value })}
                                            className="bg-background"
                                        />
                                    </div>
                                </div>

                                {/* Phase 3: Resource & ROI Fields */}
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-4 space-y-2">
                                        <Label className="text-xs">Est. Effort (Hours)</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                placeholder="e.g. 40"
                                                value={newObj.estimatedHours || ""}
                                                onChange={(e) => setNewObj({ ...newObj, estimatedHours: Number(e.target.value) })}
                                                className="bg-background pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-4 space-y-2">
                                        <Label className="text-xs">Budget Required ($)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">$</span>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={newObj.budget || ""}
                                                onChange={(e) => setNewObj({ ...newObj, budget: Number(e.target.value) })}
                                                className="bg-background pl-7"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-4 space-y-2">
                                        <Label className="text-xs">Complexity</Label>
                                        <Select value={newObj.complexity} onValueChange={(val: any) => setNewObj({ ...newObj, complexity: val })}>
                                            <SelectTrigger className="bg-background">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="High">High (Hard)</SelectItem>
                                                <SelectItem value="Medium">Medium</SelectItem>
                                                <SelectItem value="Low">Low (Easy)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Phase 3: Risk Integration */}
                                <div className="space-y-3 pt-2 border-t border-dashed">
                                    <Label className="text-xs flex items-center gap-2">
                                        <Shield className="w-3.5 h-3.5 text-warning" />
                                        Mitigated Risks / Threats
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={tempObjRisk}
                                            onChange={(e) => setTempObjRisk(e.target.value)}
                                            placeholder="Add risk (e.g. Ransomware, Insider Threat)"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addObjRisk();
                                                }
                                            }}
                                            className="bg-background h-8 text-xs"
                                        />
                                        <Button onClick={addObjRisk} size="sm" variant="outline" className="h-8">
                                            <Plus className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 min-h-[24px]">
                                        {newObj.linkedRisks?.map(r => (
                                            <Badge key={r} variant="outline" className="bg-background hover:bg-destructive/10 cursor-pointer gap-1 pl-2 pr-1 h-6" onClick={() => removeObjRisk(r)}>
                                                {r} <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <Button onClick={handleAddObjective} disabled={!newObj.title} className="w-full" variant="secondary">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Objective
                                </Button>
                            </div>

                            {/* Objectives List */}
                            <div className="space-y-3">
                                {objectives.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                        No objectives defined yet. Add one above.
                                    </div>
                                )}
                                {objectives.map((obj) => (
                                    <div key={obj.id} className="flex flex-col gap-2 p-4 border rounded-lg bg-card hover:bg-muted/5 transition-colors group">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={obj.priority === 'Critical' ? 'destructive' : obj.priority === 'High' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                                                    {obj.priority}
                                                </Badge>
                                                <span className="font-semibold text-sm">{obj.title}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEditObjective(obj)}>
                                                    <Save className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveObjective(obj.id)}>
                                                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                            {obj.alignment && (
                                                <div className="flex items-center gap-1">
                                                    <Target className="w-3 h-3" />
                                                    <span>Aligns: {obj.alignment}</span>
                                                </div>
                                            )}
                                            {obj.horizon && (
                                                <div className="flex items-center gap-1">
                                                    <CalendarIcon className="w-3 h-3" />
                                                    <span>{obj.horizon}</span>
                                                </div>
                                            )}
                                            {obj.owner && (
                                                <div className="flex items-center gap-1">
                                                    <Flag className="w-3 h-3" />
                                                    <span>Owner: {obj.owner}</span>
                                                </div>
                                            )}
                                            {obj.budget !== undefined && (
                                                <div className="flex items-center gap-1">
                                                    <DollarSign className="w-3 h-3" />
                                                    <span>${obj.budget.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {obj.estimatedHours !== undefined && obj.estimatedHours > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{obj.estimatedHours}h</span>
                                                </div>
                                            )}
                                            {obj.complexity && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded border bg-muted/30">
                                                        {obj.complexity}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {obj.linkedRisks && obj.linkedRisks.length > 0 && (
                                            <div className="flex gap-1 flex-wrap mt-1">
                                                {obj.linkedRisks.map(r => (
                                                    <Badge key={r} variant="outline" className="text-[10px] h-5 border-warning/50 text-warning bg-warning/5 gap-1">
                                                        <Shield className="w-2.5 h-2.5" />
                                                        {r}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {
                        step === 3 && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                <div className="flex items-center gap-2 mb-4">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Metrics & Governance</Label>
                                    <Separator className="flex-1" />
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    {/* Left Col: Metrics */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-primary" />
                                            Success Metrics (KPIs)
                                        </h4>

                                        <div className="p-4 rounded-lg border bg-muted/20 space-y-3">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Metric Name</Label>
                                                <Input
                                                    placeholder="e.g. Compliance Rate"
                                                    value={newMetric.name}
                                                    onChange={(e) => setNewMetric({ ...newMetric, name: e.target.value })}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Type</Label>
                                                    <Select value={newMetric.type} onValueChange={(val: any) => setNewMetric({ ...newMetric, type: val })}>
                                                        <SelectTrigger className="h-9">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Percentage">Percentage (%)</SelectItem>
                                                            <SelectItem value="Currency">Currency ($)</SelectItem>
                                                            <SelectItem value="Count">Count (#)</SelectItem>
                                                            <SelectItem value="Boolean">Yes/No</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Target</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="100"
                                                        value={newMetric.targetValue}
                                                        onChange={(e) => setNewMetric({ ...newMetric, targetValue: Number(e.target.value) })}
                                                        className="h-9"
                                                    />
                                                </div>
                                            </div>
                                            <Button onClick={handleAddMetric} disabled={!newMetric.name} size="sm" className="w-full" variant="secondary">
                                                <Plus className="w-3 h-3 mr-2" /> Add Metric
                                            </Button>
                                        </div>

                                        <div className="space-y-2">
                                            {metrics.map(m => (
                                                <div key={m.id} className="flex justify-between items-center p-3 border rounded-md bg-card text-sm group hover:bg-muted/5 transition-colors">
                                                    <div>
                                                        <p className="font-medium">{m.name}</p>
                                                        <p className="text-xs text-muted-foreground">{m.type} • Target: {m.targetValue} • {m.frequency}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEditMetric(m)}>
                                                            <Save className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveMetric(m.id)}>
                                                            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {metrics.length === 0 && <p className="text-xs text-muted-foreground italic">No metrics added.</p>}
                                        </div>
                                    </div>

                                    {/* Right Col: Governance */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold flex items-center gap-2">
                                            <Scale className="w-4 h-4 text-primary" />
                                            Governance Structure
                                        </h4>

                                        <div className="space-y-4 border rounded-lg p-4 bg-card">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Review Cadence</Label>
                                                <Select value={governance.reviewCadence} onValueChange={(val: any) => setGovernance({ ...governance, reviewCadence: val })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Weekly">Weekly Standup</SelectItem>
                                                        <SelectItem value="Monthly">Monthly Steering</SelectItem>
                                                        <SelectItem value="Quarterly">Quarterly Business Review</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs">Oversight Committee / Owner</Label>
                                                <Input
                                                    placeholder="e.g. GRC Steering Committee"
                                                    value={governance.oversightCommittee}
                                                    onChange={(e) => setGovernance({ ...governance, oversightCommittee: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs">Reporting Format</Label>
                                                <Select value={governance.reportingFormat} onValueChange={(val: any) => setGovernance({ ...governance, reportingFormat: val })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Dashboard">Live Dashboard</SelectItem>
                                                        <SelectItem value="Slide Deck">Slide Deck Presentation</SelectItem>
                                                        <SelectItem value="Report">PDF Report</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {
                        step === 4 && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                <div className="flex items-center gap-2 mb-4">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Review & Finalize</Label>
                                    <Separator className="flex-1" />
                                </div>

                                <div className="grid grid-cols-12 gap-6">
                                    {/* Summary Card */}
                                    <div className="col-span-8 space-y-6">
                                        {/* Vision Summary */}
                                        <div className="p-4 border rounded-lg bg-card space-y-3">
                                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                                <Target className="w-4 h-4 text-primary" />
                                                Strategic Context
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground text-xs block">Industry</span>
                                                    <span className="font-medium capitalize">{businessContext.industry || "Not set"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground text-xs block">Maturity</span>
                                                    <span className="font-medium">{posture.maturityLevel}</span>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-muted-foreground text-xs block">Goals</span>
                                                    <div className="flex gap-1 flex-wrap mt-1">
                                                        {businessContext.goals.map(g => (
                                                            <Badge key={g} variant="secondary" className="text-[10px]">{g}</Badge>
                                                        ))}
                                                        {businessContext.goals.length === 0 && <span className="text-sm italic text-muted-foreground">None</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Objectives Summary */}
                                        <div className="p-4 border rounded-lg bg-card space-y-3">
                                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                                <Flag className="w-4 h-4 text-primary" />
                                                Objectives ({objectives.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {objectives.map((obj, i) => (
                                                    <div key={i} className="flex justify-between items-center text-sm p-2 bg-muted/20 rounded">
                                                        <span className="font-medium">{obj.title}</span>
                                                        <Badge variant="outline" className="text-[10px]">{obj.priority}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Col: Stats & Confirm */}
                                    <div className="col-span-4 space-y-6">
                                        <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                                            <div>
                                                <span className="text-xs text-muted-foreground uppercase font-bold">Metrics</span>
                                                <p className="text-2xl font-bold">{metrics.length}</p>
                                            </div>
                                            <Separator />
                                            <div>
                                                <span className="text-xs text-muted-foreground uppercase font-bold">Est. Investment</span>
                                                <div className="flex justify-between items-center text-sm font-medium">
                                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {objectives.reduce((acc, o) => acc + (o.estimatedHours || 0), 0)} hrs</span>
                                                    <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> ${objectives.reduce((acc, o) => acc + (o.budget || 0), 0).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <Separator />
                                            <div>
                                                <span className="text-xs text-muted-foreground uppercase font-bold">Risks Addressed</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Shield className="w-4 h-4 text-warning" />
                                                    <p className="text-xl font-bold">{new Set(objectives.flatMap(o => o.linkedRisks || [])).size}</p>
                                                    <span className="text-xs text-muted-foreground">unique threats</span>
                                                </div>
                                            </div>
                                            <Separator />
                                            <div>
                                                <span className="text-xs text-muted-foreground uppercase font-bold">Review Cadence</span>
                                                <p className="font-medium">{governance.reviewCadence}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground uppercase font-bold">Reporting</span>
                                                <p className="font-medium">{governance.reportingFormat}</p>
                                            </div>
                                        </div>

                                        <Button onClick={handleSubmit} className="w-full h-12 text-base shadow-lg shadow-primary/20" disabled={createMutation.isLoading}>
                                            {createMutation.isLoading ? (initialData?.id ? "Saving..." : "Creating...") : (initialData?.id ? "Save Changes" : "Generate Roadmap")}
                                            {!createMutation.isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </CardContent >

                <CardFooter className="flex justify-between p-6 bg-muted/10 border-t items-center">
                    <Button
                        variant="ghost"
                        onClick={step === 1 ? onCancel : handleBack}
                        disabled={createMutation.isLoading}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        {step === 1 ? "Cancel Operation" : "Back to Previous"}
                    </Button>

                    <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={cn("w-2 h-2 rounded-full transition-colors", step >= i ? "bg-primary" : "bg-muted-foreground/20")} />
                            ))}
                        </div>

                        {step < 4 ? (
                            <Button onClick={handleNext} disabled={!title} className="gap-2 min-w-[120px]">
                                Next Step <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : null}
                    </div>
                </CardFooter>
            </Card>
        </div>

        {/* Edit Objective Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Strategic Objective</DialogTitle>
                    <DialogDescription>
                        Update all details for this objective. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                
                {editingObjective && (
                    <div className="space-y-6 py-4">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-title">Objective Title *</Label>
                            <Input
                                id="edit-title"
                                value={editingObjective.title}
                                onChange={(e) => setEditingObjective({...editingObjective, title: e.target.value})}
                                placeholder="What needs to be achieved?"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Priority */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-priority">Priority</Label>
                                <Select 
                                    value={editingObjective.priority} 
                                    onValueChange={(val: any) => setEditingObjective({...editingObjective, priority: val})}
                                >
                                    <SelectTrigger id="edit-priority">
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Critical">Critical</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="Low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Time Horizon */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-horizon">Time Horizon</Label>
                                <Select 
                                    value={editingObjective.horizon} 
                                    onValueChange={(val) => setEditingObjective({...editingObjective, horizon: val})}
                                >
                                    <SelectTrigger id="edit-horizon">
                                        <SelectValue placeholder="Select timeline" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Q1">Q1 (Immediate)</SelectItem>
                                        <SelectItem value="Q2">Q2 (Short Term)</SelectItem>
                                        <SelectItem value="H2">H2 (Medium Term)</SelectItem>
                                        <SelectItem value="Next Year">Next Year (Long Term)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Alignment */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-alignment">Alignment</Label>
                                <Select 
                                    value={editingObjective.alignment} 
                                    onValueChange={(val) => setEditingObjective({...editingObjective, alignment: val})}
                                >
                                    <SelectTrigger id="edit-alignment">
                                        <SelectValue placeholder="Select alignment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No specific alignment</SelectItem>
                                        {businessContext.goals.map((g, i) => (
                                            <SelectItem key={i} value={g}>{g}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Owner */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-owner">Owner</Label>
                                <Input
                                    id="edit-owner"
                                    value={editingObjective.owner}
                                    onChange={(e) => setEditingObjective({...editingObjective, owner: e.target.value})}
                                    placeholder="Who is responsible?"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Budget */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-budget">Budget ($)</Label>
                                <Input
                                    id="edit-budget"
                                    type="number"
                                    value={editingObjective.budget || 0}
                                    onChange={(e) => setEditingObjective({...editingObjective, budget: Number(e.target.value)})}
                                    placeholder="Estimated budget"
                                />
                            </div>

                            {/* Estimated Hours */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-hours">Estimated Hours</Label>
                                <Input
                                    id="edit-hours"
                                    type="number"
                                    value={editingObjective.estimatedHours || 0}
                                    onChange={(e) => setEditingObjective({...editingObjective, estimatedHours: Number(e.target.value)})}
                                    placeholder="Hours required"
                                />
                            </div>
                        </div>

                        {/* Complexity */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-complexity">Complexity</Label>
                            <Select 
                                value={editingObjective.complexity || "Medium"} 
                                onValueChange={(val: any) => setEditingObjective({...editingObjective, complexity: val})}
                            >
                                <SelectTrigger id="edit-complexity">
                                    <SelectValue placeholder="Select complexity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="High">High (Hard)</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Low">Low (Easy)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Linked Risks */}
                        <div className="space-y-2">
                            <Label>Linked Risks</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={tempObjRisk}
                                    onChange={(e) => setTempObjRisk(e.target.value)}
                                    placeholder="Add a risk reference"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && tempObjRisk && editingObjective) {
                                            e.preventDefault();
                                            if (!editingObjective.linkedRisks?.includes(tempObjRisk)) {
                                                setEditingObjective({
                                                    ...editingObjective,
                                                    linkedRisks: [...(editingObjective.linkedRisks || []), tempObjRisk]
                                                });
                                            }
                                            setTempObjRisk("");
                                        }
                                    }}
                                />
                                <Button 
                                    onClick={() => {
                                        if (tempObjRisk && editingObjective && !editingObjective.linkedRisks?.includes(tempObjRisk)) {
                                            setEditingObjective({
                                                ...editingObjective,
                                                linkedRisks: [...(editingObjective.linkedRisks || []), tempObjRisk]
                                            });
                                            setTempObjRisk("");
                                        }
                                    }} 
                                    variant="secondary"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {editingObjective.linkedRisks && editingObjective.linkedRisks.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {editingObjective.linkedRisks.map((risk, index) => (
                                        <Badge key={index} variant="outline" className="gap-1">
                                            {risk}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4 ml-1"
                                                onClick={() => {
                                                    const newRisks = [...editingObjective.linkedRisks];
                                                    newRisks.splice(index, 1);
                                                    setEditingObjective({...editingObjective, linkedRisks: newRisks});
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description (Optional)</Label>
                            <Textarea
                                id="edit-description"
                                value={editingObjective.description || ""}
                                onChange={(e) => setEditingObjective({...editingObjective, description: e.target.value})}
                                placeholder="Additional details about this objective..."
                                rows={3}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancelEdit}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveEditedObjective} disabled={!editingObjective?.title}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Edit Metric Dialog */}
        <Dialog open={editMetricDialogOpen} onOpenChange={setEditMetricDialogOpen}>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Success Metric</DialogTitle>
                    <DialogDescription>
                        Update the details of this success metric (KPI).
                    </DialogDescription>
                </DialogHeader>
                
                {editingMetric && (
                    <div className="space-y-4 py-4">
                        {/* Metric Name */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-metric-name">Metric Name</Label>
                            <Input
                                id="edit-metric-name"
                                value={editingMetric.name}
                                onChange={(e) => setEditingMetric({...editingMetric, name: e.target.value})}
                                placeholder="e.g. Compliance Rate, Risk Reduction"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Metric Type */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-metric-type">Type</Label>
                                <Select 
                                    value={editingMetric.type} 
                                    onValueChange={(val: any) => setEditingMetric({...editingMetric, type: val})}
                                >
                                    <SelectTrigger id="edit-metric-type">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                            <SelectItem value="Percentage">Percentage (%)</SelectItem>
                                            <SelectItem value="Currency">Currency ($)</SelectItem>
                                            <SelectItem value="Count">Count (#)</SelectItem>
                                            <SelectItem value="Boolean">Yes/No</SelectItem>
                                        </SelectContent>
                                </Select>
                            </div>

                            {/* Target Value */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-metric-target">Target Value</Label>
                                <Input
                                    id="edit-metric-target"
                                    type="number"
                                    value={editingMetric.targetValue}
                                    onChange={(e) => setEditingMetric({...editingMetric, targetValue: Number(e.target.value)})}
                                    placeholder="Target value"
                                />
                            </div>
                        </div>

                        {/* Frequency */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-metric-frequency">Reporting Frequency</Label>
                            <Select 
                                value={editingMetric.frequency} 
                                onValueChange={(val: any) => setEditingMetric({...editingMetric, frequency: val})}
                            >
                                <SelectTrigger id="edit-metric-frequency">
                                    <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Monthly">Monthly</SelectItem>
                                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                                    <SelectItem value="Annually">Annually</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancelMetricEdit}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveEditedMetric} disabled={!editingMetric?.name}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
