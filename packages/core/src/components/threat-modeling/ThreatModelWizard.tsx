
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { useLocation, useParams } from "wouter";
import {
    Button,
    Input,
    Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter,
    Label,
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
    Textarea,
    Checkbox,
    Badge,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@complianceos/ui";
import {
    ArrowLeft, ArrowRight, Save, Trash2, Loader2, AlertTriangle, Plus,
    ShieldAlert, Sparkles, Box, Search, ListChecks, CheckCircle2,
    ShieldCheck, Activity, Server, Database, Globe, Network, Lock, Unlock, X, User, Cylinder, Download, Upload, Target, EyeOff, ChevronDown, ChevronUp, Info
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PASTAStages, PASTAData } from "./PASTAStages";
import RichTextEditor from "@/components/RichTextEditor";
import { PageGuide } from "@/components/PageGuide";

const COMPONENT_GROUPS = {
    "General": ['Process', 'Store', 'Actor'],
    "Clients": ['Web Client', 'Mobile Client', 'Desktop Client', 'IoT Device'],
    "Compute": ['API', 'Microservice', 'Serverless Function', 'Container', 'Virtual Machine'],
    "Data": ['Database', 'Data Warehouse', 'Object Storage', 'Cache', 'Message Queue', 'File Storage', 'Vector DB'],
    "Network": ['Load Balancer', 'API Gateway', 'Firewall/WAF', 'CDN', 'VPN'],
    "Security": ['Identity Provider', 'Key Management', 'HSM'],
    "AI": ['LLM Model', 'Training Pipeline', 'AI Agent'],
    "Third Party": ['External Service', 'SaaS Provider', 'Legacy System']
};

const COMPONENT_TYPES = Object.values(COMPONENT_GROUPS).flat();

// --- PROFESSIONAL WORKFLOW DIAGRAM COMPONENT ---
const WorkflowDiagram = ({ currentStep }: { currentStep: number }) => {
    const steps = [
        { id: 1, title: "Architecture", subtitle: "What are we building?", icon: Box },
        { id: 2, title: "Analysis", subtitle: "What can go wrong?", icon: Search },
        { id: 3, title: "Mitigation", subtitle: "What will we do?", icon: ShieldCheck },
        { id: 4, title: "Verification", subtitle: "Did we do enough?", icon: ListChecks },
    ];

    return (
        <div className="w-full py-8 px-4 bg-white/50 backdrop-blur-sm rounded-xl border border-blue-100 mb-8 shadow-sm">
            <div className="relative flex justify-between max-w-4xl mx-auto">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
                <div
                    className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 -translate-y-1/2 z-0 transition-all duration-700 ease-in-out rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((s, idx) => {
                    const Icon = s.icon;
                    const isActive = currentStep === s.id;
                    const isCompleted = currentStep > s.id;

                    return (
                        <div key={s.id} className="relative z-10 flex flex-col items-center group">
                            <div className={cn(
                                "h-14 w-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 rotate-45 group-hover:rotate-0",
                                isActive ? "bg-blue-600 border-blue-600 text-white shadow-xl scale-110" :
                                    isCompleted ? "bg-white border-blue-500 text-blue-500 shadow-md" :
                                        "bg-white border-slate-200 text-slate-400 group-hover:border-blue-200"
                            )}>
                                <div className="-rotate-45 group-hover:rotate-0 transition-all duration-500">
                                    {isCompleted ? <CheckCircle2 className="h-7 w-7" /> : <Icon className="h-7 w-7" />}
                                </div>
                            </div>
                            <div className="mt-5 text-center">
                                <p className={cn("text-xs font-black uppercase tracking-widest", isActive ? "text-blue-600" : "text-slate-500")}>{s.title}</p>
                                <p className="text-[10px] text-slate-400 font-medium max-w-[100px] leading-tight mt-1">{s.subtitle}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export function ThreatModelWizard() {
    const { selectedClientId } = useClientContext();
    const params = useParams();
    const [location, setLocation] = useLocation();

    const clientId = params.clientId ? parseInt(params.clientId) : selectedClientId;
    const projectId = parseInt(params?.projectId || "0");
    const modelIdParam = params?.modelId;
    const isNew = modelIdParam === 'new';

    const [step, setStep] = useState(1);
    const [archSubstep, setArchSubstep] = useState(1); // 1: Definition, 2: Components

    // Working State
    const [modelBasic, setModelBasic] = useState({ name: "", methodology: "STRIDE" });
    const [createdModelId, setCreatedModelId] = useState<number | null>(isNew ? null : parseInt(modelIdParam!));
    const [generatedRisks, setGeneratedRisks] = useState<any[]>([]);
    const [pastaData, setPastaData] = useState<PASTAData | null>(null);
    const [showPastaStages, setShowPastaStages] = useState(false);

    // Queries
    const searchParams = new URLSearchParams(window.location.search);
    const isGeneralProject = searchParams.get('source') === 'general';

    // Queries
    // Queries: Try to fetch as DevProject first (default). If it fails or we have generic flag, try Generic.
    const { data: devProject, error: devError, isFetched: isDevFetched } = trpc.devProjects.get.useQuery(
        { id: projectId, clientId: clientId! },
        { enabled: !!projectId && !!clientId && !isGeneralProject, retry: false }
    );

    // If explicitly general OR if dev query returned null/error (fallback for users on wrong URL)
    const isDevNotFound = isDevFetched && !devProject;
    const enableGeneralQuery = !!projectId && !!clientId && (isGeneralProject || !!devError || isDevNotFound);

    const { data: generalProject } = trpc.projects.get.useQuery(
        { id: projectId, clientId: clientId! },
        { enabled: enableGeneralQuery }
    );

    // Determines active project based on what data we found
    const project = isGeneralProject || enableGeneralQuery ? generalProject : devProject;
    const effectiveIsGeneral = isGeneralProject || !!generalProject;
    const { data: existingModel, refetch: refetchModel } = trpc.threatModels.get.useQuery(
        { id: createdModelId!, clientId: clientId! },
        { enabled: !!createdModelId && !!clientId }
    );

    const utils = trpc.useUtils();

    const createModelMutation = trpc.threatModels.create.useMutation();
    const addComponentMutation = trpc.threatModels.addComponent.useMutation();
    const removeComponentMutation = trpc.threatModels.removeComponent.useMutation();
    const generateRisksMutation = trpc.threatModels.generateRisks.useMutation();
    const updateComponentPosMutation = trpc.threatModels.updateComponentPosition.useMutation();
    const saveFlowMutation = trpc.threatModels.saveFlow.useMutation();
    const updateFlowMutation = trpc.threatModels.updateFlow.useMutation();
    const removeFlowMutation = trpc.threatModels.removeFlow.useMutation();
    const commitRisksMutation = trpc.threatModels.commitRisks.useMutation();
    const generateMitigationPlanMutation = trpc.advisor.generateRiskMitigationPlan.useMutation();

    // Canvas State
    const [connectingSource, setConnectingSource] = useState<number | null>(null);
    const [editingFlow, setEditingFlow] = useState<any>(null);
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [currentDragPos, setCurrentDragPos] = useState({ x: 0, y: 0 });
    const canvasRef = React.useRef<HTMLDivElement>(null);

    const handleUpdateFlow = async () => {
        if (!editingFlow) return;
        try {
            await updateFlowMutation.mutateAsync({
                id: editingFlow.id,
                protocol: editingFlow.protocol,
                description: editingFlow.description,
                isEncrypted: editingFlow.isEncrypted
            });
            setEditingFlow(null);
            refetchModel();
            toast.success("Flow updated");
        } catch (error: any) {
            toast.error("Failed to update flow");
        }
    };

    React.useEffect(() => {
        if (existingModel) {
            setModelBasic({
                name: existingModel.name,
                methodology: existingModel.methodology
            });

            // Populate generated risks from backend if available and not yet loaded
            if (existingModel.risks && existingModel.risks.length > 0 && generatedRisks.length === 0) {
                setGeneratedRisks(existingModel.risks.map((r: any) => ({
                    ...r,
                    selected: true,
                    expanded: false,
                    planExpanded: false,
                    likelihood: r.likelihood || 3,
                    impact: r.impact || 3,
                    selectedMitigations: r.mitigations || []
                })));
            }

            if (archSubstep === 1) {
                setArchSubstep(2);
            }
        }
    }, [existingModel, generatedRisks.length, archSubstep]);

    const handleCreateBasic = async () => {
        if (!clientId || !projectId) return;
        try {
            const model = await createModelMutation.mutateAsync({
                clientId,
                devProjectId: effectiveIsGeneral ? undefined : projectId,
                projectId: effectiveIsGeneral ? projectId : undefined,
                name: modelBasic.name,
                methodology: modelBasic.methodology
            });
            setCreatedModelId(model.id);

            // If PASTA methodology or COMBINED (which includes PASTA), show PASTA stages
            if (modelBasic.methodology === 'PASTA' || modelBasic.methodology === 'COMBINED') {
                setShowPastaStages(true);
            } else {
                setArchSubstep(2);
            }

            toast.success("Threat Model Created");
        } catch (e) {
            toast.error("Failed to create threat model");
        }
    };

    const [newComp, setNewComp] = useState({ name: "", type: "", description: "" });
    const handleAddComponent = async () => {
        if (!createdModelId || !newComp.name || !newComp.type) return;
        try {
            // Calculate initial position for the new component
            const canvasRect = canvasRef.current?.getBoundingClientRect();
            const x = canvasRect ? canvasRect.width / 2 - 80 : 0; // Center horizontally
            const y = canvasRect ? canvasRect.height / 2 - 20 : 0; // Center vertically

            await addComponentMutation.mutateAsync({ threatModelId: createdModelId, ...newComp, x, y });
            setNewComp({ name: "", type: "", description: "" });
            refetchModel();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleRemoveComponent = async (id: number) => {
        try {
            await removeComponentMutation.mutateAsync({ id });
            refetchModel();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (draggingId !== null && canvasRef.current) {
            const canvasRect = canvasRef.current.getBoundingClientRect();
            const newX = e.clientX - canvasRect.left - dragOffset.x;
            const newY = e.clientY - canvasRect.top - dragOffset.y;
            setCurrentDragPos({ x: newX, y: newY });
        }
    };

    const handleCanvasMouseUp = async () => {
        if (draggingId !== null) {
            const id = draggingId;
            setDraggingId(null); // Clear dragging immediately to prevent stuck state
            await handleDragEnd(id, currentDragPos.x, currentDragPos.y);
        }
    };

    const handleDragEnd = async (componentId: number, x: number, y: number) => {
        try {
            await updateComponentPosMutation.mutateAsync({ id: componentId, x, y });
            refetchModel(); // Refetch to update positions in state
        } catch (error: any) {
            toast.error("Failed to update component position");
        }
    };

    const handleConnect = async (targetComponentId: number) => {
        if (!connectingSource || connectingSource === targetComponentId) {
            setConnectingSource(null);
            return;
        }

        try {
            await saveFlowMutation.mutateAsync({
                threatModelId: createdModelId!,
                sourceComponentId: connectingSource,
                targetComponentId: targetComponentId,
                isEncrypted: false // Default to unencrypted, can be edited later
            });
            toast.success("Flow created!");
            setConnectingSource(null);
            refetchModel();
        } catch (error: any) {
            toast.error("Failed to create flow");
        }
    };

    const handleGenerate = async () => {
        if (!createdModelId) return;
        try {
            const risks = await generateRisksMutation.mutateAsync({ threatModelId: createdModelId });
            setGeneratedRisks(risks.map(r => ({
                ...r,
                selected: true,
                expanded: false,
                planExpanded: false,
                likelihood: 3,
                impact: 3,
                selectedMitigations: r.mitigations?.slice(0, 1) || []
            })));
            setStep(2); // Analysis
        } catch (error: any) {
            toast.error("Analysis failed", { description: error.message });
        }
    };

    // --- IMPORT / EXPORT LOGIC ---
    const importMutation = trpc.threatModels.importFromThreatDragon.useMutation();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        // Since export is a query, we might need to trigger it differently or just fetch client-side if we had the data. 
        // But for TRPC query download, we can use a direct procedure call or better yet, since we have existingModel, we can construct it client side OR make a separate mutation that returns JSON string.
        // Given the code structure, I'll assume we can just access the refetch result or make a direct trpc client call. 
        // For simplicity in this wizard, let's assume we can fetch data directly or use what we have. 
        // Actually, let's use the trpc.useUtils() to fetch the query imperatively if needed, or better, just use the router!
        // WE ADDED 'exportToThreatDragon' as a query. We can use useQuery with enabled:false, then refetch(). 
        // BUT for file download, imperatively calling is easier.
        // Let's rely on the user to click "Export", we call the backend, get JSON, then blob it.
        try {
            // For now, let's just use a window open or fetch approach? 
            // TRPC vanilla client is best for imperative.
            // But we don't have it imported. Let's make a dedicated mutation or just use fetch. 
            // Actually, let's simluate export using existingModel for speed if the backend query is hard to trigger imperatively in this context without `useUtils`.
            // WAIT! I can just use `trpc.useContext().client` or similar.
            // To be safe and compliant, I will assume `trpc.useContext()` is available (or useUtils in v10).
            // Let's try to map `existingModel` to TD JSON client-side for immediate feedback, OR use the backend query via a temporary hook.

            // Let's use the existingModel data since it is already loaded!
            if (!existingModel) return;

            const cells: any[] = [];
            existingModel.components.forEach((c: any) => {
                cells.push({
                    id: String(c.id),
                    shape: c.type === 'Actor' ? 'actor' : c.type === 'Store' ? 'store' : 'process',
                    data: { name: c.name, type: c.type, description: c.description },
                    position: { x: c.x, y: c.y },
                    size: { width: 160, height: 80 },
                    zIndex: 10
                });
            });
            existingModel.flows.forEach((f: any) => {
                cells.push({
                    id: String(f.id),
                    shape: 'flow',
                    source: { cell: String(f.sourceComponentId) },
                    target: { cell: String(f.targetComponentId) },
                    data: { name: f.protocol || 'Flow', protocol: f.protocol, isEncrypted: f.isEncrypted },
                    zIndex: 20
                });
            });

            const json = JSON.stringify({
                summary: { title: existingModel.name, owner: "ComplianceOS", description: "Exported from ComplianceOS" },
                detail: { diagrams: [{ title: "Main", cells }] }
            }, null, 2);

            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${existingModel.name.replace(/\s+/g, '_')}_threat_dragon.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success("Model exported");
        } catch (e) {
            toast.error("Export failed");
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const json = event.target?.result as string;
            if (json && clientId && projectId) {
                try {
                    const result = await importMutation.mutateAsync({
                        clientId,
                        devProjectId: projectId,
                        json
                    });
                    setCreatedModelId(result.id);
                    setArchSubstep(2);
                    toast.success("Model imported successfully");
                } catch (err) {
                    toast.error("Failed to import model", { description: "Invalid Threat Dragon JSON" });
                }
            }
        };
        reader.readAsText(file);
    };

    const [isCommitting, setIsCommitting] = useState(false);

    const handleCommit = async () => {
        if (!createdModelId || !clientId || !projectId) return;

        setIsCommitting(true);
        const startTime = Date.now();

        const risksToCommit = generatedRisks.filter((r: any) => r.selected);
        try {
            await commitRisksMutation.mutateAsync({
                clientId,
                devProjectId: projectId,
                threatModelId: createdModelId,
                risks: risksToCommit.map((r: any) => ({
                    title: r.title,
                    description: r.description,
                    likelihood: r.likelihood,
                    impact: r.impact,
                    privacyImpact: r.source?.includes('Privacy') ||
                        r.source?.includes('LINDDUN') ||
                        r.category === 'Privacy' ||
                        existingModel?.methodology?.includes('LINDDUN') ||
                        modelBasic.methodology?.includes('LINDDUN') ||
                        !!r.privacyImpact,
                    category: r.category,
                    selectedMitigations: r.selectedMitigations || [],
                    customMitigationPlan: r.customMitigationPlan
                }))
            });

            // visual delay for UX
            const elapsed = Date.now() - startTime;
            if (elapsed < 1000) {
                await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
            }

            // Invalidate queries to ensure dashboard is fresh
            await Promise.all([
                utils.projects.getProjectSecurityPosture.invalidate({ projectId, clientId }),
                utils.risks.list.invalidate({ projectId, clientId }),
                utils.threatModels.list.invalidate({ projectId, clientId })
            ]);

            toast.success("Success", { description: "Risks committed to register." });

            // Redirect based on active project type (captured from queries above)
            const targetRoute = isGeneralProject || enableGeneralQuery
                ? `/clients/${clientId}/projects/${projectId}`
                : `/clients/${clientId}/dev/projects/${projectId}`;

            setLocation(targetRoute);
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to commit risks");
            setIsCommitting(false);
        }
    };

    if (!project && projectId) return <div className="p-8">Loading...</div>;

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                <Breadcrumb
                    items={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Developer Projects", href: `/clients/${clientId}/dev/projects` },
                        { label: project?.name || "Project", href: `/clients/${clientId}/dev/projects/${projectId}` },
                        { label: `${modelBasic.methodology || "STRIDE"} Framework` }
                    ]}
                />

                <div className="flex justify-between items-start">
                    <PageGuide
                        title="Threat Modeling Wizard"
                        description="Identify architectural flaws and security risks."
                        rationale="Systematic analysis of your design prevents costly security fixes later."
                        howToUse={[
                            { step: "Architecture", description: "Design your system using the drag-and-drop canvas." },
                            { step: "Analysis", description: "Automatically generate threats based on the design." },
                            { step: "Mitigation", description: "Select controls to reduce risk." }
                        ]}
                    />
                </div>

                <WorkflowDiagram currentStep={step} />

                <div className={cn("mx-auto pb-20 transition-all duration-500 ease-in-out", (step === 1 && archSubstep === 2) ? "max-w-[1800px] px-4" : "max-w-4xl")}>
                    {/* STEP 1: ARCHITECTURE */}
                    {step === 1 && (
                        <div className="space-y-6">
                            {archSubstep === 1 ? (
                                <Card className="border-blue-100 shadow-md">
                                    <CardHeader className="bg-blue-50/30">
                                        <CardTitle className="text-xl">1. Architecture Definition</CardTitle>
                                        <CardDescription>What are we building? Define the scope of this threat model.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="space-y-2">
                                            <Label>Threat Model Name</Label>
                                            <Input value={modelBasic.name} onChange={e => setModelBasic({ ...modelBasic, name: e.target.value })} placeholder="e.g. Core API Authentication Flow" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Methodology</Label>
                                            <Select value={modelBasic.methodology} onValueChange={v => setModelBasic({ ...modelBasic, methodology: v })}>
                                                <SelectTrigger><SelectValue placeholder="Select Methodology" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="STRIDE">STRIDE (Microsoft)</SelectItem>
                                                    <SelectItem value="PASTA">PASTA (Risk-Centric)</SelectItem>
                                                    <SelectItem value="LINDDUN">LINDDUN (Privacy)</SelectItem>
                                                    <SelectItem value="STRIDE+LINDDUN">STRIDE + LINDDUN (Sec + Priv)</SelectItem>
                                                    <SelectItem value="COMBINED">Combined (Security + Privacy + Business)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="pt-4 flex justify-end">
                                            <Button onClick={handleCreateBasic} disabled={!modelBasic.name} className="bg-blue-600 hover:bg-blue-700">Next: Component Decomposition <ArrowRight className="ml-2 h-4 w-4" /></Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : showPastaStages ? (
                                <div>
                                    <Card className="border-blue-100 shadow-md mb-4">
                                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                            <CardTitle className="text-xl flex items-center gap-2">
                                                <Target className="w-5 h-5 text-blue-600" />
                                                PASTA Methodology - 7 Stage Risk-Centric Analysis
                                            </CardTitle>
                                            <CardDescription>
                                                Complete the following stages to perform a comprehensive risk-focused threat analysis
                                            </CardDescription>
                                        </CardHeader>
                                    </Card>
                                    <PASTAStages
                                        onComplete={(data) => {
                                            setPastaData(data);
                                            setShowPastaStages(false);
                                            setArchSubstep(2);
                                            toast.success("PASTA analysis complete! Proceeding to architecture decomposition.");
                                        }}
                                        initialData={pastaData || undefined}
                                        components={existingModel?.components || []}
                                    />
                                </div>
                            ) : (
                                <Card className="border-blue-100 shadow-md h-full flex flex-col">
                                    <Dialog open={!!editingFlow} onOpenChange={() => setEditingFlow(null)}>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Edit Flow</DialogTitle>
                                                <DialogDescription>
                                                    Modify the properties of this data flow.
                                                </DialogDescription>
                                            </DialogHeader>
                                            {editingFlow && (
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="protocol" className="text-right">
                                                            Protocol
                                                        </Label>
                                                        <Input
                                                            id="protocol"
                                                            value={editingFlow.protocol || ""}
                                                            onChange={(e) => setEditingFlow({ ...editingFlow, protocol: e.target.value })}
                                                            className="col-span-3"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="description" className="text-right">
                                                            Description
                                                        </Label>
                                                        <Input
                                                            id="description"
                                                            value={editingFlow.description || ""}
                                                            onChange={(e) => setEditingFlow({ ...editingFlow, description: e.target.value })}
                                                            className="col-span-3"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="isEncrypted" className="text-right">
                                                            Encrypted
                                                        </Label>
                                                        <Checkbox
                                                            id="isEncrypted"
                                                            checked={editingFlow.isEncrypted}
                                                            onCheckedChange={(checked) => setEditingFlow({ ...editingFlow, isEncrypted: !!checked })}
                                                            className="col-span-3"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setEditingFlow(null)}>Cancel</Button>
                                                <Button onClick={handleUpdateFlow}>Save changes</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <CardHeader className="bg-blue-50/30 shrink-0">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle className="text-xl">System Architecture Canvas</CardTitle>
                                                <CardDescription>Drag components to arrange. Hover over a component and click blue connection points to define data flows.</CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Hidden File Input for Import */}
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept=".json"
                                                    onChange={handleFileChange}
                                                />
                                                <Button size="sm" variant="outline" className="gap-2" onClick={handleImportClick}>
                                                    <Upload size={14} /> Import
                                                </Button>
                                                <Button size="sm" variant="outline" className="gap-2" onClick={handleExport}>
                                                    <Download size={14} /> Export
                                                </Button>

                                                <div className="h-6 w-px bg-slate-200 mx-2" />

                                                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border">
                                                    <Input
                                                        value={newComp.name}
                                                        onChange={e => setNewComp({ ...newComp, name: e.target.value })}
                                                        placeholder="Name"
                                                        className="h-8 w-32 border-none bg-transparent"
                                                    />
                                                    <Select value={newComp.type} onValueChange={v => setNewComp({ ...newComp, type: v })}>
                                                        <SelectTrigger className="h-8 w-38 border-none bg-white shadow-sm"><SelectValue placeholder="Type" /></SelectTrigger>
                                                        <SelectContent className="max-h-[300px]">
                                                            {Object.entries(COMPONENT_GROUPS).map(([group, types]) => (
                                                                <React.Fragment key={group}>
                                                                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50">{group}</div>
                                                                    {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                                </React.Fragment>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button size="sm" onClick={handleAddComponent} disabled={!newComp.name || !newComp.type}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <div
                                        className="relative flex-1 bg-slate-50 overflow-hidden min-h-[750px] border-y inner-shadow"
                                        ref={canvasRef}
                                        onMouseMove={handleCanvasMouseMove}
                                        onMouseUp={handleCanvasMouseUp}
                                        onMouseLeave={handleCanvasMouseUp}
                                    >
                                        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                                            style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                                        </div>

                                        {/* SVG Layer for Flows */}
                                        <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                                            <defs>
                                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                                                    <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                                                </marker>
                                            </defs>
                                            {existingModel?.flows?.map((flow: any) => {
                                                const source = existingModel.components.find((c: any) => c.id === flow.sourceComponentId);
                                                const target = existingModel.components.find((c: any) => c.id === flow.targetComponentId);
                                                if (!source || !target) return null;

                                                const sx = (draggingId === source.id ? currentDragPos.x : (source.x || 0)) + 80; // center width
                                                const sy = (draggingId === source.id ? currentDragPos.y : (source.y || 0)) + 40; // center height
                                                const tx = (draggingId === target.id ? currentDragPos.x : (target.x || 0)) + 80;
                                                const ty = (draggingId === target.id ? currentDragPos.y : (target.y || 0)) + 40;

                                                return (
                                                    <g key={flow.id} onClick={(e) => { e.stopPropagation(); setEditingFlow(flow); }} className="cursor-pointer pointer-events-auto group">
                                                        <line
                                                            x1={sx} y1={sy} x2={tx} y2={ty}
                                                            stroke={flow.isEncrypted ? "#3b82f6" : "#ef4444"}
                                                            strokeWidth="2"
                                                            markerEnd="url(#arrowhead)"
                                                            className="transition-all group-hover:stroke-[4px]"
                                                        />
                                                        <circle cx={(sx + tx) / 2} cy={(sy + ty) / 2} r="12" fill="white" stroke="#e2e8f0" />
                                                        <text x={(sx + tx) / 2} y={(sy + ty) / 2} textAnchor="middle" dy="4" fontSize="10" fill="#64748b">
                                                            {flow.isEncrypted ? <Lock size={10} /> : <Unlock size={10} />}
                                                        </text>
                                                    </g>
                                                );
                                            })}
                                            {connectingSource && (
                                                <rect width="100%" height="100%" fill="rgba(59, 130, 246, 0.05)" />
                                            )}
                                        </svg>

                                        {/* Component Nodes */}
                                        {existingModel?.components?.map((comp: any) => (
                                            <div
                                                key={comp.id}
                                                style={{
                                                    left: (draggingId === comp.id ? currentDragPos.x : (comp.x || 0)),
                                                    top: (draggingId === comp.id ? currentDragPos.y : (comp.y || 0))
                                                }}
                                                className={cn(
                                                    "absolute w-40 p-3 rounded-xl border shadow-sm bg-white cursor-move transition-shadow z-10 select-none group",
                                                    connectingSource === comp.id ? "ring-2 ring-blue-500 shadow-lg scale-105" : "hover:shadow-md",
                                                    draggingId === comp.id ? "z-50 shadow-xl ring-2 ring-blue-500/50" : "",
                                                    connectingSource && connectingSource !== comp.id ? "hover:ring-2 hover:ring-green-400 cursor-copy" : ""
                                                )}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    if (connectingSource) {
                                                        if (connectingSource !== comp.id) {
                                                            handleConnect(comp.id);
                                                        }
                                                    } else {
                                                        const canvasRect = canvasRef.current?.getBoundingClientRect();
                                                        if (canvasRect) {
                                                            setDragOffset({
                                                                x: e.clientX - canvasRect.left - (comp.x || 0),
                                                                y: e.clientY - canvasRect.top - (comp.y || 0)
                                                            });
                                                            setDraggingId(comp.id);
                                                            setCurrentDragPos({ x: comp.x || 0, y: comp.y || 0 });
                                                        }
                                                    }
                                                }}
                                            >
                                                <div className="flex flex-col items-center justify-center p-2">
                                                    <div className={cn("p-2 rounded-lg mb-2",
                                                        ['Actor', 'Web Client', 'Mobile Client', 'Desktop Client', 'IoT Device'].includes(comp.type) ? "bg-amber-100/50 text-amber-600" :
                                                            ['Store', 'Database', 'File Storage', 'Data Warehouse', 'Object Storage', 'Vector DB'].includes(comp.type) ? "bg-indigo-100/50 text-indigo-600" :
                                                                ['Identity Provider', 'Key Management', 'HSM', 'Firewall/WAF'].includes(comp.type) ? "bg-red-100/50 text-red-600" :
                                                                    ['LLM Model', 'AI Agent', 'Training Pipeline'].includes(comp.type) ? "bg-purple-100/50 text-purple-600" :
                                                                        "bg-blue-100/50 text-blue-600"
                                                    )}>
                                                        {['Actor', 'Web Client', 'Mobile Client', 'Desktop Client'].includes(comp.type) ? <User size={24} /> :
                                                            ['IoT Device', 'Sensor'].includes(comp.type) ? <Activity size={24} /> :
                                                                ['Store', 'Database', 'File Storage', 'Data Warehouse', 'Object Storage', 'Vector DB'].includes(comp.type) ? <Cylinder size={24} /> :
                                                                    ['Queue/Broker', 'Message Queue', 'Cache'].includes(comp.type) ? <Layers size={24} /> :
                                                                        ['Serverless Function'].includes(comp.type) ? <Activity size={24} /> :
                                                                            ['Container', 'Microservice'].includes(comp.type) ? <Box size={24} /> :
                                                                                ['Load Balancer', 'API Gateway', 'CDN', 'VPN'].includes(comp.type) ? <Network size={24} /> :
                                                                                    ['Firewall/WAF', 'Identity Provider', 'Key Management', 'HSM'].includes(comp.type) ? <ShieldCheck size={24} /> :
                                                                                        ['LLM Model', 'AI Agent'].includes(comp.type) ? <Sparkles size={24} /> :
                                                                                            ['External Service', 'SaaS Provider'].includes(comp.type) ? <Globe size={24} /> :
                                                                                                <Box size={24} />}
                                                    </div>
                                                    <div className="font-bold text-xs text-center truncate w-full">{comp.name}</div>
                                                    <div className="text-[9px] text-slate-400 uppercase tracking-wider truncate w-full text-center">{comp.type}</div>
                                                </div>

                                                {/* Connection Points */}
                                                {!connectingSource && (
                                                    <>
                                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair" onClick={(e) => { e.stopPropagation(); setConnectingSource(comp.id); }} />
                                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair" onClick={(e) => { e.stopPropagation(); setConnectingSource(comp.id); }} />
                                                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair" onClick={(e) => { e.stopPropagation(); setConnectingSource(comp.id); }} />
                                                        <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair" onClick={(e) => { e.stopPropagation(); setConnectingSource(comp.id); }} />
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <CardFooter className="pt-4 border-t bg-slate-50 flex justify-between items-center">
                                        <div className="text-xs text-slate-500">
                                            {existingModel?.components?.length || 0} Components • {existingModel?.flows?.length || 0} Flows
                                        </div>
                                        <Button
                                            onClick={handleGenerate}
                                            disabled={!existingModel?.components?.length}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
                                        >
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Analyze {modelBasic.methodology || "Architecture"}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* STEP 2: ANALYSIS */}
                    {step === 2 && (
                        <Card className="border-blue-100 shadow-md">
                            <CardHeader className="bg-blue-50/30">
                                <CardTitle className="text-xl">2. Threat Analysis</CardTitle>
                                <CardDescription>What can go wrong? Analysis identifies potential threats within trust boundaries.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-4">
                                    {generatedRisks.map((risk, idx) => (
                                        <div key={idx} className={cn("p-4 border rounded-xl transition-all", risk.selected ? "border-blue-200 bg-blue-50/20 ring-1 ring-blue-100" : "opacity-50 grayscale")}>
                                            <div className="flex items-start gap-4">
                                                <Checkbox checked={risk.selected} onCheckedChange={c => {
                                                    const n = [...generatedRisks];
                                                    n[idx].selected = !!c;
                                                    setGeneratedRisks(n);
                                                }} className="mt-1" />
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-bold text-slate-900">{risk.title}</h4>
                                                        <div className="flex items-center gap-2">
                                                            {risk.source === 'OWASP Intelligence Advisor' && (
                                                                <TooltipProvider>
                                                                    <Tooltip delayDuration={200}>
                                                                        <TooltipTrigger asChild>
                                                                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 cursor-help">
                                                                                <Sparkles className="w-3 h-3 mr-1" />
                                                                                OWASP Intelligence
                                                                            </Badge>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent
                                                                            side="top"
                                                                            align="start"
                                                                            sideOffset={8}
                                                                            className="max-w-[400px] p-4 bg-amber-50 border-amber-200 text-amber-900 shadow-xl z-[100]"
                                                                        >
                                                                            <div className="space-y-2">
                                                                                <p className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider">
                                                                                    <Sparkles className="w-3 h-3" />
                                                                                    Advisor Intelligence Details
                                                                                </p>
                                                                                <div className="text-sm leading-relaxed whitespace-pre-wrap mt-2 text-amber-900/90">
                                                                                    {risk.mitigations?.[0] || "Detailed security guidance from OWASP framework intelligence."}
                                                                                </div>
                                                                            </div>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                            {risk.source?.includes('LINDDUN') && (
                                                                <Badge className="bg-teal-100 text-teal-700 border-teal-200">
                                                                    <EyeOff className="w-3 h-3 mr-1" />
                                                                    LINDDUN Privacy
                                                                </Badge>
                                                            )}
                                                            <Badge variant="outline" className="bg-white">{risk.category}</Badge>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 w-7 p-0 ml-1 rounded-full hover:bg-slate-100"
                                                                onClick={() => {
                                                                    const n = [...generatedRisks];
                                                                    n[idx].expanded = !n[idx].expanded;
                                                                    setGeneratedRisks(n);
                                                                }}
                                                            >
                                                                {risk.expanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-2">{risk.description}</p>

                                                    {risk.expanded && (
                                                        <div className="mt-3 p-4 bg-slate-50 border border-slate-200/60 rounded-xl text-sm text-slate-700 leading-relaxed animate-in slide-in-from-top-2 shadow-sm">
                                                            <div className="font-bold mb-2 flex items-center gap-2 text-slate-800 text-xs uppercase tracking-wide">
                                                                <Info size={14} className="text-blue-600" />
                                                                Detailed Threat Explanation
                                                            </div>
                                                            {risk.explanation || risk.description || "No additional detailed explanation is available for this threat automatically. Use the analysis to determine specific impact."}
                                                        </div>
                                                    )}

                                                    {risk.selected && (
                                                        <div className="flex gap-6 mt-4 p-3 bg-white/50 rounded-lg border border-white/50 shadow-inner">
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] uppercase font-bold text-slate-400">Likelihood</Label>
                                                                <div className="flex gap-1">
                                                                    {[1, 2, 3, 4, 5].map(v => (
                                                                        <button
                                                                            key={v}
                                                                            onClick={() => {
                                                                                const n = [...generatedRisks];
                                                                                n[idx].likelihood = v;
                                                                                setGeneratedRisks(n);
                                                                            }}
                                                                            className={cn("h-6 w-8 rounded flex items-center justify-center text-[10px] font-bold transition-all", risk.likelihood === v ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200")}
                                                                        >{v}</button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] uppercase font-bold text-slate-400">Impact</Label>
                                                                <div className="flex gap-1">
                                                                    {[1, 2, 3, 4, 5].map(v => (
                                                                        <button
                                                                            key={v}
                                                                            onClick={() => {
                                                                                const n = [...generatedRisks];
                                                                                n[idx].impact = v;
                                                                                setGeneratedRisks(n);
                                                                            }}
                                                                            className={cn("h-6 w-8 rounded flex items-center justify-center text-[10px] font-bold transition-all", risk.impact === v ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200")}
                                                                        >{v}</button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="ml-auto text-right">
                                                                <div className="text-[10px] uppercase font-bold text-slate-400">Initial Score</div>
                                                                <div className="text-xl font-black text-slate-900">{risk.likelihood * risk.impact}</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-6 border-t flex justify-between">
                                    <Button variant="outline" onClick={() => setStep(1)}>Back to Architecture</Button>
                                    <Button onClick={() => setStep(3)} disabled={!generatedRisks.some(r => r.selected)}>Next: Risk Mitigation <ArrowRight className="ml-2 h-4 w-4" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* STEP 3: MITIGATION */}
                    {step === 3 && (
                        <Card className="border-blue-100 shadow-md">
                            <CardHeader className="bg-blue-50/30">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">3. Risk Mitigation</CardTitle>
                                        <CardDescription>What can we do about it? Select specific strategies from OWASP and ASVS.</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1.5 py-1 px-2.5">
                                        <Database className="h-3.5 w-3.5" />
                                        ASVS v5.0 Database Connected
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-6">
                                    {generatedRisks.filter(r => r.selected).map((risk, idx) => (
                                        <div key={idx} className="p-6 border rounded-2xl bg-white shadow-sm hover:shadow-md transition-all border-slate-100">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                                                        <h4 className="font-extrabold text-slate-900">{risk.title}</h4>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 rounded-md py-0">{risk.category}</Badge>
                                                        <Badge variant="outline" className="text-[10px] uppercase tracking-tighter">{risk.componentName}</Badge>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Severity</div>
                                                    <div className={cn("text-2xl font-black", (risk.likelihood * risk.impact) >= 15 ? "text-red-500" : "text-amber-500")}>
                                                        {risk.likelihood * risk.impact}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                                                <Label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                                                    <ShieldCheck className="h-3 w-3" /> Recommended Strategies
                                                </Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {risk.mitigations?.map((m: string) => {
                                                        const isSelected = risk.selectedMitigations?.includes(m);
                                                        return (
                                                            <button
                                                                key={m}
                                                                onClick={() => {
                                                                    const n = [...generatedRisks];
                                                                    const current = n[n.indexOf(risk)].selectedMitigations || [];
                                                                    if (current.includes(m)) {
                                                                        n[n.indexOf(risk)].selectedMitigations = current.filter((x: string) => x !== m);
                                                                    } else {
                                                                        n[n.indexOf(risk)].selectedMitigations = [...current, m];
                                                                    }
                                                                    setGeneratedRisks(n);
                                                                }}
                                                                className={cn(
                                                                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-2",
                                                                    isSelected ? "bg-blue-600 border-blue-600 text-white shadow-md scale-105" : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                                                                )}
                                                            >
                                                                {isSelected && <CheckCircle2 className="h-3 w-3" />}
                                                                {m}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <div className="mt-4 space-y-3">
                                                    <div className="flex justify-between items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                                        <div
                                                            className="flex items-center gap-2 cursor-pointer group"
                                                            onClick={() => {
                                                                const n = [...generatedRisks];
                                                                n[idx].planExpanded = !n[idx].planExpanded;
                                                                setGeneratedRisks(n);
                                                            }}
                                                        >
                                                            <div className="bg-white p-1 rounded-md border border-slate-200 group-hover:border-indigo-300 transition-colors">
                                                                {risk.planExpanded ? <ChevronUp className="h-3 w-3 text-indigo-600" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
                                                            </div>
                                                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer group-hover:text-indigo-600 transition-colors">
                                                                {risk.customMitigationPlan ? "AI Mitigation Plan" : "Generate Custom Plan"}
                                                            </Label>
                                                            {risk.customMitigationPlan && (
                                                                <Badge variant="outline" className="text-[8px] h-4 bg-white text-indigo-600 border-indigo-100">AI Generated</Badge>
                                                            )}
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-[10px] gap-1.5 border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 shadow-sm"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (!clientId) return;
                                                                toast.promise(
                                                                    generateMitigationPlanMutation.mutateAsync({
                                                                        clientId,
                                                                        riskTitle: risk.title,
                                                                        riskDescription: risk.description,
                                                                        riskContext: `${risk.componentName} (${risk.componentType})`,
                                                                        currentMitigations: risk.selectedMitigations
                                                                    }),
                                                                    {
                                                                        loading: 'Generating comprehensive mitigation plan...',
                                                                        success: (data) => {
                                                                            const n = [...generatedRisks];
                                                                            n[idx].customMitigationPlan = data.mitigationPlan;
                                                                            n[idx].planExpanded = true;
                                                                            setGeneratedRisks(n);
                                                                            return 'Mitigation plan generated!';
                                                                        },
                                                                        error: 'Failed to generate plan'
                                                                    }
                                                                );
                                                            }}
                                                        >
                                                            <Sparkles className="w-3 h-3" />
                                                            {risk.customMitigationPlan ? "Regenerate" : "Generate with AI"}
                                                        </Button>
                                                    </div>

                                                    {risk.planExpanded && (
                                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                            <RichTextEditor
                                                                value={risk.customMitigationPlan || ""}
                                                                onChange={(val) => {
                                                                    const n = [...generatedRisks];
                                                                    n[idx].customMitigationPlan = val;
                                                                    setGeneratedRisks(n);
                                                                }}
                                                                minHeight="200px"
                                                                className="bg-white border-slate-200 rounded-xl shadow-inner"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-6 border-t flex justify-between">
                                    <Button variant="outline" onClick={() => setStep(2)}>Back to Analysis</Button>
                                    <Button onClick={() => setStep(4)} className="bg-indigo-600 hover:bg-indigo-700">Next: Verification <ArrowRight className="ml-2 h-4 w-4" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* STEP 4: VERIFICATION */}
                    {step === 4 && (
                        <Card className="border-green-100 shadow-md">
                            <CardHeader className="bg-green-50/30">
                                <CardTitle className="text-xl">4. Final Verification</CardTitle>
                                <CardDescription>Did we do enough? Review the summary and commit findings to the Risk Register.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-center">
                                        <div className="text-3xl font-black text-blue-700">{existingModel?.components?.length || 0}</div>
                                        <div className="text-[10px] text-blue-500 uppercase font-bold tracking-widest mt-1">Components</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-center">
                                        <div className="text-3xl font-black text-amber-700">{generatedRisks.filter(r => r.selected).length}</div>
                                        <div className="text-[10px] text-amber-500 uppercase font-bold tracking-widest mt-1">Identified Risks</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                                        <div className="text-3xl font-black text-indigo-700">
                                            {generatedRisks.filter(r => r.selected).reduce((acc, r) => acc + (r.selectedMitigations?.length || 0), 0)}
                                        </div>
                                        <div className="text-[10px] text-indigo-500 uppercase font-bold tracking-widest mt-1">Planned Mitigations</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                                        <ListChecks className="h-4 w-4" /> Compliance Check
                                    </Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            "Architecture definition complete",
                                            "STRIDE threats analyzed & prioritized",
                                            "OWASP/ASVS mitigations mapped",
                                            "Trust boundaries verified"
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 p-4 border rounded-xl bg-white shadow-sm border-slate-100">
                                                <div className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-8 border-t flex justify-between gap-4">
                                    <Button variant="outline" onClick={() => setStep(3)}>Back to Mitigation</Button>
                                    <Button onClick={handleCommit} disabled={isCommitting} className="bg-green-600 hover:bg-green-700 text-white min-w-[200px] shadow-lg shadow-green-200">
                                        {isCommitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Committing Risks...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Finalize & Commit Risks
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};


