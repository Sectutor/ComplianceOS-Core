import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import {
    ScrollText,
    Save,
    Printer,
    Share2,
    ArrowLeft,
    Shield,
    Info,
    CheckCircle2,
    Clock,
    Loader2,
    Plus,
    Lock,
    Key,
    Link as LinkIcon,
    Trash2,
    ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface SectionContent {
    systemName?: string;
    systemId?: string;
    systemPurpose?: string;
    securityLevel?: string;
    boundaryDescription?: string;
    diagramUrl?: string;
    environmentDescription?: string;
    rolesDescription?: string;
    attachmentsNotes?: string;
    // FIPS
    securityObjectiveConfidentiality?: string;
    securityObjectiveIntegrity?: string;
    securityObjectiveAvailability?: string;
    rationaleConfidentiality?: string;
    rationaleIntegrity?: string;
    rationaleAvailability?: string;
}

export default function SSPEditor() {
    const params = useParams();
    const clientId = Number(params.id);
    // Determine framework from URL path segment
    const pathParts = window.location.pathname.split('/');
    const frameworkSlug = pathParts[pathParts.length - 1]; // e.g., 'ssp-171' or 'ssp-172'
    const frameworkLabel = frameworkSlug === 'ssp-171' ? 'NIST 800-171 Rev 2' : 'NIST 800-172 Enhanced';

    const { data: ssps, isLoading: loadingSSPs, error: sspsError } = trpc.federal.listSSPs.useQuery({ clientId });

    // Find the SSP for the current framework
    const currentSSP = ssps?.find(ssp => ssp.framework === frameworkSlug);

    // Fetch controls for NIST 800-172 framework
    const { data: controls, isLoading: loadingControls } = trpc.federal.getControlsByFramework.useQuery({
        clientId,
        framework: 'NIST 800-172'
    }, {
        enabled: !!currentSSP && frameworkSlug === 'ssp-172'
    });

    // Fetch already selected controls for this SSP
    const { data: sspControls, isLoading: loadingSspControls } = trpc.federal.getSspControls.useQuery({
        clientId,
        sspId: currentSSP?.id || 0
    }, {
        enabled: !!currentSSP?.id
    });

    // Mutations for controls management
    const saveSspControlMutation = trpc.federal.saveSspControl.useMutation();
    const deleteSspControlMutation = trpc.federal.deleteSspControl.useMutation();
    const createControlMutation = trpc.federal.createControl.useMutation();
    const createSSPMutation = trpc.federal.createSSP.useMutation();
    const saveFipsMutation = trpc.federal.saveFipsCategorization.useMutation();
    const utils = trpc.useUtils();

    // Fetch FIPS Categorization
    const { data: fipsCategorization } = trpc.federal.getFipsCategorization.useQuery({
        clientId,
        sspId: currentSSP?.id || 0
    }, {
        enabled: !!currentSSP?.id
    });

    const [activeTab, setActiveTab] = useState("overview");
    const [sectionData, setSectionData] = useState<Record<string, SectionContent>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showCustomControlForm, setShowCustomControlForm] = useState(false);
    const [newControl, setNewControl] = useState({
        name: '',
        description: '',
        category: '',
        controlId: `CUSTOM-${Date.now()}`,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    // Initialize section data from current SSP
    useEffect(() => {
        if (currentSSP) {
            try {
                // Ensure content is a non-empty string before parsing
                const content = (currentSSP.content && currentSSP.content.trim() !== '')
                    ? JSON.parse(currentSSP.content)
                    : {};
                setSectionData(content);
            } catch (error) {
                console.error("Error parsing SSP content:", error);
                setSectionData({}); // Default to empty if parsing fails
            }
        }
    }, [currentSSP]);

    // Initialize FIPS data
    useEffect(() => {
        if (fipsCategorization) {
            setSectionData(prev => ({
                ...prev,
                overview: {
                    ...prev.overview,
                    securityObjectiveConfidentiality: fipsCategorization.securityObjectiveConfidentiality || 'low',
                    securityObjectiveIntegrity: fipsCategorization.securityObjectiveIntegrity || 'low',
                    securityObjectiveAvailability: fipsCategorization.securityObjectiveAvailability || 'low',
                    rationaleConfidentiality: fipsCategorization.rationaleConfidentiality || '',
                    rationaleIntegrity: fipsCategorization.rationaleIntegrity || '',
                    rationaleAvailability: fipsCategorization.rationaleAvailability || '',
                }
            }));
        }
    }, [fipsCategorization]);

    const updateField = (section: string, field: string, value: string) => {
        setSectionData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
                lastUpdated: new Date().toISOString()
            }
        }));
    };

    const updateCheckbox = (section: string, field: string, value: boolean) => {
        setSectionData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
                lastUpdated: new Date().toISOString()
            }
        }));
    };

    // Control management handlers
    const handleControlToggle = async (controlId: string, checked: boolean) => {
        if (!currentSSP?.id) return;

        try {
            if (checked) {
                // Add control to SSP
                await saveSspControlMutation.mutateAsync({
                    clientId,
                    sspId: currentSSP.id,
                    controlId,
                    implementationStatus: 'planned',
                });
                toast.success('Control added to SSP');
            } else {
                // Remove control from SSP
                await deleteSspControlMutation.mutateAsync({
                    clientId,
                    sspId: currentSSP.id,
                    controlId,
                });
                toast.success('Control removed from SSP');
            }
        } catch (error) {
            console.error('Error toggling control:', error);
            toast.error('Failed to update control');
        }
    };

    const handleControlStatusChange = async (controlId: string, status: string) => {
        if (!currentSSP?.id) return;

        try {
            await saveSspControlMutation.mutateAsync({
                clientId,
                sspId: currentSSP.id,
                controlId,
                implementationStatus: status,
            });
        } catch (error) {
            console.error('Error updating control status:', error);
            toast.error('Failed to update control status');
        }
    };

    const handleControlDetailsChange = async (
        controlId: string,
        field: 'implementationDescription' | 'responsibleRole',
        value: string
    ) => {
        if (!currentSSP?.id) return;

        try {
            await saveSspControlMutation.mutateAsync({
                clientId,
                sspId: currentSSP.id,
                controlId,
                [field]: value,
            });
        } catch (error) {
            console.error('Error updating control details:', error);
            toast.error('Failed to update control details');
        }
    };

    const handleAddEvidence = async (controlId: string, name: string, url: string) => {
        if (!currentSSP?.id) return;

        // Find current control data
        const sspControl = sspControls?.find(c => c.controlId === controlId);
        const currentEvidence = (sspControl?.evidenceLinks as any[]) || [];

        const newEvidence = [...currentEvidence, {
            id: `ev-${Date.now()}`,
            name,
            url,
            type: 'link'
        }];

        try {
            await saveSspControlMutation.mutateAsync({
                clientId,
                sspId: currentSSP.id,
                controlId,
                evidenceLinks: newEvidence,
            });
            toast.success("Evidence added");
        } catch (error) {
            console.error("Error adding evidence:", error);
            toast.error("Failed to add evidence");
        }
    };

    const handleRemoveEvidence = async (controlId: string, evidenceId: string) => {
        if (!currentSSP?.id) return;

        const sspControl = sspControls?.find(c => c.controlId === controlId);
        const currentEvidence = (sspControl?.evidenceLinks as any[]) || [];

        const newEvidence = currentEvidence.filter((e: any) => e.id !== evidenceId);

        try {
            await saveSspControlMutation.mutateAsync({
                clientId,
                sspId: currentSSP.id,
                controlId,
                evidenceLinks: newEvidence,
            });
            toast.success("Evidence removed");
        } catch (error) {
            console.error("Error removing evidence:", error);
            toast.error("Failed to remove evidence");
        }
    };

    const handleNewControlChange = (field: string, value: string) => {
        setNewControl(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCreateCustomControl = async () => {
        if (!newControl.name.trim()) {
            toast.error('Control name is required');
            return;
        }

        try {
            await createControlMutation.mutateAsync({
                controlId: newControl.controlId,
                name: newControl.name,
                description: newControl.description,
                framework: 'CUSTOM',
                category: newControl.category || 'Custom',
                clientId: clientId,
            });

            toast.success('Custom control created successfully');
            setNewControl({
                name: '',
                description: '',
                category: '',
                controlId: `CUSTOM-${Date.now()}`,
            });
            setShowCustomControlForm(false);
        } catch (error) {
            console.error('Error creating custom control:', error);
            toast.error('Failed to create custom control');
        }
    };

    const handleCreateSSP = async () => {
        setIsSaving(true);
        try {
            await createSSPMutation.mutateAsync({
                clientId,
                title: `${frameworkLabel} - Initial Draft`,
                framework: frameworkSlug,
                systemName: 'New System',
                systemType: 'Internal',
            });
            toast.success("SSP created successfully");
            utils.federal.listSSPs.invalidate({ clientId });
        } catch (error) {
            console.error("Error creating SSP:", error);
            toast.error("Failed to create SSP");
        } finally {
            setIsSaving(false);
        }
    };

    const getSectionStatus = (section: string) => {
        const data = sectionData[section];
        if (!data) return "empty";

        // Special handling for controls section
        if (section === 'controls') {
            // For controls, we'll consider it "in-progress" if there's any data
            const hasAnyData = Object.keys(data).some(key => key !== 'lastUpdated');
            return hasAnyData ? "in-progress" : "empty";
        }

        const requiredFields = {
            overview: ['systemName', 'systemId', 'systemPurpose', 'securityLevel'],
            boundary: ['boundaryDescription', 'diagramUrl'],
            environment: ['environmentDescription'],
            roles: ['rolesDescription'],
            attachments: ['attachmentsNotes']
        }[section] || [];

        const filledCount = requiredFields.filter(field => data[field] && data[field].trim().length > 0).length;
        if (filledCount === 0) return "empty";
        if (filledCount === requiredFields.length) return "complete";
        return "in-progress";
    };

    const handleSaveSection = async (section: string) => {
        if (!currentSSP) {
            toast.error("No SSP found to update");
            return;
        }

        setIsSaving(true);
        try {
            const content = {
                ...sectionData,
                [section]: {
                    ...sectionData[section],
                    lastUpdated: new Date().toISOString()
                }
            };

            await trpc.federal.updateSSP.mutate({
                clientId,
                id: currentSSP.id,
                content: JSON.stringify(content)
            });

            // Save FIPS data if in overview section
            if (section === 'overview') {
                await saveFipsMutation.mutateAsync({
                    clientId,
                    sspId: currentSSP.id,
                    securityObjectiveConfidentiality: sectionData['overview']?.securityObjectiveConfidentiality,
                    securityObjectiveIntegrity: sectionData['overview']?.securityObjectiveIntegrity,
                    securityObjectiveAvailability: sectionData['overview']?.securityObjectiveAvailability,
                    rationaleConfidentiality: sectionData['overview']?.rationaleConfidentiality,
                    rationaleIntegrity: sectionData['overview']?.rationaleIntegrity,
                    rationaleAvailability: sectionData['overview']?.rationaleAvailability,
                });
            }

            toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} section saved successfully`);
        } catch (error) {
            console.error("Error saving section:", error);
            toast.error("Failed to save section");
        } finally {
            setIsSaving(false);
        }
    };

    if (loadingSSPs) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </DashboardLayout>
        );
    }

    if (sspsError) {
        return (
            <DashboardLayout>
                <div className="p-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h2 className="text-lg font-bold text-red-900 mb-2">Backend Connection Error</h2>
                        <p className="text-red-700 mb-4">Unable to connect to the backend server. Please check if the server is running.</p>
                        <div className="text-sm text-red-600 bg-red-100 p-3 rounded">
                            <p>Error details: {sspsError.message}</p>
                            <p className="mt-2">Make sure the TRPC server is running on port 3001</p>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!currentSSP) {
        return (
            <DashboardLayout>
                <div className="p-8">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                        <Shield className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-yellow-900 mb-2">No SSP Found</h2>
                        <p className="text-yellow-700 mb-6">
                            No System Security Plan found for {frameworkLabel}. Please create an SSP first.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link href={`/clients/${clientId}/federal`}>
                                <Button variant="outline" className="border-yellow-600 text-yellow-700 hover:bg-yellow-50">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Hub
                                </Button>
                            </Link>
                            <Button
                                onClick={handleCreateSSP}
                                disabled={isSaving}
                                className="bg-yellow-600 hover:bg-yellow-700 font-bold"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4 mr-2" />
                                )}
                                Initialize {frameworkSlug.toUpperCase()}
                            </Button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Breadcrumb
                    items={[
                        { label: "Clients", href: "/clients" },
                        { label: `Client ${clientId}`, href: `/clients/${clientId}` },
                        { label: "Federal Compliance", href: `/clients/${clientId}/federal` },
                        { label: frameworkLabel, href: `/clients/${clientId}/federal/${frameworkSlug}` }
                    ]}
                />

                <div className="mt-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                                System Security Plan Editor
                            </h1>
                            <p className="text-slate-600 mt-2">
                                {frameworkLabel} - {currentSSP.systemName || "Unnamed System"}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="border-slate-300">
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                            </Button>
                            <Button variant="outline" className="border-slate-300">
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                            </Button>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Save className="h-4 w-4 mr-2" />
                                Save All
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Left sidebar - Navigation */}
                        <div className="lg:col-span-1">
                            <Card className="border-slate-200 shadow-sm sticky top-8">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-bold text-slate-900">Sections</CardTitle>
                                    <CardDescription>Complete all sections for a comprehensive SSP</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="space-y-1">
                                        {[
                                            { id: "overview", label: "1. System Overview", icon: ScrollText },
                                            { id: "boundary", label: "2. System Boundary", icon: Shield },
                                            { id: "environment", label: "3. Operational Environment", icon: Info },
                                            { id: "controls", label: "4. Security Requirements", icon: Lock },
                                            { id: "roles", label: "5. Roles & Responsibilities", icon: CheckCircle2 },
                                            { id: "attachments", label: "6. Attachments & References", icon: Clock }
                                        ].map((section) => {
                                            const status = getSectionStatus(section.id);
                                            const Icon = section.icon;
                                            return (
                                                <button
                                                    key={section.id}
                                                    onClick={() => setActiveTab(section.id)}
                                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${activeTab === section.id ? 'bg-blue-50 text-blue-700 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 text-slate-700'}`}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                    <div className="flex-1">
                                                        <div className="font-medium">{section.label}</div>
                                                    </div>
                                                    {status === "complete" && (
                                                        <Badge className="bg-green-100 text-green-800 border-green-200">Complete</Badge>
                                                    )}
                                                    {status === "in-progress" && (
                                                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">In Progress</Badge>
                                                    )}
                                                    {status === "empty" && (
                                                        <Badge variant="outline" className="text-slate-500">Empty</Badge>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Progress Summary */}
                            <Card className="border-slate-200 shadow-sm mt-6">
                                <CardContent className="p-6">
                                    <h3 className="font-bold text-slate-900 mb-4">Progress Summary</h3>
                                    <div className="space-y-3">
                                        {["overview", "boundary", "environment", "controls", "roles", "attachments"].map((section) => {
                                            const status = getSectionStatus(section);
                                            const labels = {
                                                overview: "System Overview",
                                                boundary: "System Boundary",
                                                environment: "Operational Environment",
                                                controls: "Security Requirements",
                                                roles: "Roles & Responsibilities",
                                                attachments: "Attachments & References"
                                            };
                                            return (
                                                <div key={section} className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-700">{labels[section as keyof typeof labels]}</span>
                                                    <div className="flex items-center gap-2">
                                                        {status === "complete" && (
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                        )}
                                                        {status === "in-progress" && (
                                                            <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                                                        )}
                                                        {status === "empty" && (
                                                            <div className="h-2 w-2 rounded-full bg-slate-300" />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main content area */}
                        <div className="lg:col-span-3">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid grid-cols-6 mb-8">
                                    <TabsTrigger value="overview">Overview</TabsTrigger>
                                    <TabsTrigger value="boundary">Boundary</TabsTrigger>
                                    <TabsTrigger value="environment">Environment</TabsTrigger>
                                    <TabsTrigger value="controls">Controls</TabsTrigger>
                                    <TabsTrigger value="roles">Roles</TabsTrigger>
                                    <TabsTrigger value="attachments">Attachments</TabsTrigger>
                                </TabsList>

                                {/* System Overview */}
                                <TabsContent value="overview" className="space-y-6">
                                    <div className="space-y-2 mb-8">
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">1. System Overview</h2>
                                        <p className="text-slate-500">Basic information about the system and its purpose.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="border-slate-200 shadow-sm">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-lg font-bold text-slate-900">System Identification</CardTitle>
                                                <CardDescription>Unique identifiers for the system</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-900">System Name</label>
                                                    <Input
                                                        placeholder="Enter system name (e.g., 'Enterprise Resource Planning System')"
                                                        value={sectionData['overview']?.systemName || ''}
                                                        onChange={(e) => updateField('overview', 'systemName', e.target.value)}
                                                        className="border-slate-200 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-900">System Identifier</label>
                                                    <Input
                                                        placeholder="Enter system ID (e.g., 'ERP-001')"
                                                        value={sectionData['overview']?.systemId || ''}
                                                        onChange={(e) => updateField('overview', 'systemId', e.target.value)}
                                                        className="border-slate-200 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-slate-200 shadow-sm">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-lg font-bold text-slate-900">System Purpose & Classification</CardTitle>
                                                <CardDescription>Mission and security classification</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-900">System Purpose</label>
                                                    <Textarea
                                                        placeholder="Describe the system's mission, functions, and business value..."
                                                        value={sectionData['overview']?.systemPurpose || ''}
                                                        onChange={(e) => updateField('overview', 'systemPurpose', e.target.value)}
                                                        className="min-h-[120px] border-slate-200 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-900">Security Impact Level</label>
                                                    <select
                                                        value={sectionData['overview']?.securityLevel || ''}
                                                        onChange={(e) => updateField('overview', 'securityLevel', e.target.value)}
                                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        <option value="">Select impact level</option>
                                                        <option value="low">Low Impact</option>
                                                        <option value="moderate">Moderate Impact</option>
                                                        <option value="high">High Impact</option>
                                                    </select>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>


                                    {/* FIPS 199 Categorization */}
                                    <div className="mt-8">
                                        <div className="space-y-2 mb-4">
                                            <h3 className="text-xl font-bold text-slate-900">FIPS 199 Security Categorization</h3>
                                            <p className="text-slate-500">Determine the security category of the system based on the potential impact of loss.</p>
                                        </div>

                                        <Card className="border-slate-200 shadow-sm">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-lg font-bold text-slate-900">Security Objectives</CardTitle>
                                                <CardDescription>Select the potential impact level for each security objective.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {/* Confidentiality */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                                                    <div className="md:col-span-1">
                                                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                                            <Lock className="h-4 w-4 text-blue-600" />
                                                            Confidentiality
                                                        </h4>
                                                        <p className="text-sm text-slate-500 mt-1">Preserving authorized restrictions on information access and disclosure.</p>
                                                    </div>
                                                    <div className="md:col-span-2 space-y-3">
                                                        <div className="flex gap-4">
                                                            {['low', 'moderate', 'high'].map((level) => (
                                                                <label key={level} className={`flex-1 border rounded-lg p-3 cursor-pointer transition-all ${sectionData['overview']?.securityObjectiveConfidentiality === level ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-slate-50 border-slate-200'}`}>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <input
                                                                            type="radio"
                                                                            name="confidentiality"
                                                                            value={level}
                                                                            checked={sectionData['overview']?.securityObjectiveConfidentiality === level}
                                                                            onChange={(e) => updateField('overview', 'securityObjectiveConfidentiality', e.target.value)}
                                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                                        />
                                                                        <span className="font-bold text-slate-900 capitalize">{level}</span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-500">
                                                                        {level === 'low' && "Limited adverse effect"}
                                                                        {level === 'moderate' && "Serious adverse effect"}
                                                                        {level === 'high' && "Severe/catastrophic adverse effect"}
                                                                    </p>
                                                                </label>
                                                            ))}
                                                        </div>
                                                        <Textarea
                                                            placeholder="Justification for Confidentiality impact level..."
                                                            value={sectionData['overview']?.rationaleConfidentiality || ''}
                                                            onChange={(e) => updateField('overview', 'rationaleConfidentiality', e.target.value)}
                                                            className="min-h-[80px] border-slate-200 focus:ring-blue-500 text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Integrity */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                                                    <div className="md:col-span-1">
                                                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                                            <Shield className="h-4 w-4 text-green-600" />
                                                            Integrity
                                                        </h4>
                                                        <p className="text-sm text-slate-500 mt-1">Guarding against improper information modification or destruction.</p>
                                                    </div>
                                                    <div className="md:col-span-2 space-y-3">
                                                        <div className="flex gap-4">
                                                            {['low', 'moderate', 'high'].map((level) => (
                                                                <label key={level} className={`flex-1 border rounded-lg p-3 cursor-pointer transition-all ${sectionData['overview']?.securityObjectiveIntegrity === level ? 'bg-green-50 border-green-500 ring-1 ring-green-500' : 'hover:bg-slate-50 border-slate-200'}`}>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <input
                                                                            type="radio"
                                                                            name="integrity"
                                                                            value={level}
                                                                            checked={sectionData['overview']?.securityObjectiveIntegrity === level}
                                                                            onChange={(e) => updateField('overview', 'securityObjectiveIntegrity', e.target.value)}
                                                                            className="h-4 w-4 text-green-600 focus:ring-green-500"
                                                                        />
                                                                        <span className="font-bold text-slate-900 capitalize">{level}</span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-500">
                                                                        {level === 'low' && "Limited adverse effect"}
                                                                        {level === 'moderate' && "Serious adverse effect"}
                                                                        {level === 'high' && "Severe/catastrophic adverse effect"}
                                                                    </p>
                                                                </label>
                                                            ))}
                                                        </div>
                                                        <Textarea
                                                            placeholder="Justification for Integrity impact level..."
                                                            value={sectionData['overview']?.rationaleIntegrity || ''}
                                                            onChange={(e) => updateField('overview', 'rationaleIntegrity', e.target.value)}
                                                            className="min-h-[80px] border-slate-200 focus:ring-green-500 text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Availability */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                                                    <div className="md:col-span-1">
                                                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-orange-600" />
                                                            Availability
                                                        </h4>
                                                        <p className="text-sm text-slate-500 mt-1">Ensuring timely and reliable access to and use of information.</p>
                                                    </div>
                                                    <div className="md:col-span-2 space-y-3">
                                                        <div className="flex gap-4">
                                                            {['low', 'moderate', 'high'].map((level) => (
                                                                <label key={level} className={`flex-1 border rounded-lg p-3 cursor-pointer transition-all ${sectionData['overview']?.securityObjectiveAvailability === level ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500' : 'hover:bg-slate-50 border-slate-200'}`}>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <input
                                                                            type="radio"
                                                                            name="availability"
                                                                            value={level}
                                                                            checked={sectionData['overview']?.securityObjectiveAvailability === level}
                                                                            onChange={(e) => updateField('overview', 'securityObjectiveAvailability', e.target.value)}
                                                                            className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                                                                        />
                                                                        <span className="font-bold text-slate-900 capitalize">{level}</span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-500">
                                                                        {level === 'low' && "Limited adverse effect"}
                                                                        {level === 'moderate' && "Serious adverse effect"}
                                                                        {level === 'high' && "Severe/catastrophic adverse effect"}
                                                                    </p>
                                                                </label>
                                                            ))}
                                                        </div>
                                                        <Textarea
                                                            placeholder="Justification for Availability impact level..."
                                                            value={sectionData['overview']?.rationaleAvailability || ''}
                                                            onChange={(e) => updateField('overview', 'rationaleAvailability', e.target.value)}
                                                            className="min-h-[80px] border-slate-200 focus:ring-orange-500 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button
                                            onClick={() => handleSaveSection('overview')}
                                            disabled={isSaving}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4 mr-2" />
                                            )}
                                            Save Overview
                                        </Button>
                                    </div>
                                </TabsContent>

                                {/* System Boundary */}
                                <TabsContent value="boundary" className="space-y-6">
                                    <div className="space-y-2 mb-8">
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">2. System Boundary</h2>
                                        <p className="text-slate-500">Define what's included in and excluded from the system.</p>
                                    </div>

                                    <Card className="border-slate-200 shadow-sm">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg font-bold text-slate-900">Boundary Description</CardTitle>
                                            <CardDescription>Components, interfaces, and data flows within the system boundary</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-900">Boundary Definition</label>
                                                    <Textarea
                                                        placeholder="Describe system components, hardware, software, interfaces, and data flows..."
                                                        value={sectionData['boundary']?.boundaryDescription || ''}
                                                        onChange={(e) => updateField('boundary', 'boundaryDescription', e.target.value)}
                                                        className="min-h-[200px] border-slate-200 focus:ring-blue-500 leading-relaxed py-4"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-900">Architecture Diagram URL</label>
                                                    <Input
                                                        placeholder="Enter URL to system architecture diagram (e.g., Lucidchart, Draw.io)"
                                                        value={sectionData['boundary']?.diagramUrl || ''}
                                                        onChange={(e) => updateField('boundary', 'diagramUrl', e.target.value)}
                                                        className="border-slate-200 focus:ring-blue-500"
                                                    />
                                                    <p className="text-sm text-slate-500">Provide a link to your system architecture diagram for visual reference</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="flex justify-end">
                                        <Button
                                            onClick={() => handleSaveSection('boundary')}
                                            disabled={isSaving}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4 mr-2" />
                                            )}
                                            Save Boundary
                                        </Button>
                                    </div>
                                </TabsContent>

                                {/* Operational Environment */}
                                <TabsContent value="environment" className="space-y-6">
                                    <div className="space-y-2 mb-8">
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">3. Operational Environment</h2>
                                        <p className="text-slate-500">Describe where and how the system operates.</p>
                                    </div>

                                    <Card className="border-slate-200 shadow-sm">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg font-bold text-slate-900">Environment Details</CardTitle>
                                            <CardDescription>Physical, technical, and personnel environment</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-900">Environment Description</label>
                                                    <Textarea
                                                        placeholder="Describe cloud providers, data centers, personnel access controls..."
                                                        value={sectionData['environment']?.environmentDescription || ''}
                                                        onChange={(e) => updateField('environment', 'environmentDescription', e.target.value)}
                                                        className="min-h-[200px] border-slate-200 focus:ring-blue-500 leading-relaxed py-4"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="flex justify-end">
                                        <Button
                                            onClick={() => handleSaveSection('environment')}
                                            disabled={isSaving}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4 mr-2" />
                                            )}
                                            Save Environment
                                        </Button>
                                    </div>
                                </TabsContent>

                                {/* Security Requirements */}
                                <TabsContent value="controls" className="space-y-6">
                                    <div className="space-y-2 mb-8">
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">4. Security Requirements</h2>
                                        <p className="text-slate-500">Document the implementation status of NIST 800-172 Enhanced security controls.</p>
                                    </div>

                                    {/* Controls Selection & Implementation */}
                                    <div className="space-y-8">
                                        <Card className="border-slate-200 shadow-sm">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Shield className="h-6 w-6 text-blue-600" />
                                                        <CardTitle className="text-lg font-bold text-slate-900">NIST 800-172 Controls</CardTitle>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            variant="outline"
                                                            className="border-slate-300"
                                                            onClick={() => setShowCustomControlForm(!showCustomControlForm)}
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            {showCustomControlForm ? 'Cancel' : 'Add Custom Control'}
                                                        </Button>
                                                        <Button className="bg-blue-600 hover:bg-blue-700">
                                                            <Save className="h-4 w-4 mr-2" />
                                                            Save Controls
                                                        </Button>
                                                    </div>
                                                </div>
                                                <CardDescription>Select and document implementation of enhanced security controls</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {/* Search and Filter */}
                                                <div className="flex flex-col md:flex-row gap-4">
                                                    <div className="flex-1">
                                                        <Input
                                                            placeholder="Search controls by ID or name..."
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            className="border-slate-200 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={selectedCategory}
                                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        >
                                                            <option value="">All Categories</option>
                                                            <option value="apt">APT Protection</option>
                                                            <option value="crypto">Cryptographic Protection</option>
                                                            <option value="access">Access Controls</option>
                                                            <option value="integrity">System Integrity</option>
                                                        </select>
                                                        <select
                                                            value={selectedStatus}
                                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        >
                                                            <option value="">All Status</option>
                                                            <option value="implemented">Implemented</option>
                                                            <option value="partial">Partially Implemented</option>
                                                            <option value="planned">Planned</option>
                                                            <option value="not-applicable">Not Applicable</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Custom Control Form */}
                                                {showCustomControlForm && (
                                                    <Card className="border-blue-200 bg-blue-50/50 mb-6">
                                                        <CardContent className="p-6">
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-3 mb-4">
                                                                    <Plus className="h-5 w-5 text-blue-600" />
                                                                    <h3 className="font-bold text-blue-900">Create Custom Control</h3>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <label className="text-sm font-bold text-slate-900">Control Name *</label>
                                                                        <Input
                                                                            value={newControl.name}
                                                                            onChange={(e) => handleNewControlChange('name', e.target.value)}
                                                                            placeholder="Enter control name"
                                                                            className="border-slate-200 focus:ring-blue-500"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-sm font-bold text-slate-900">Category</label>
                                                                        <Input
                                                                            value={newControl.category}
                                                                            onChange={(e) => handleNewControlChange('category', e.target.value)}
                                                                            placeholder="e.g., Custom, APT Protection, etc."
                                                                            className="border-slate-200 focus:ring-blue-500"
                                                                        />
                                                                    </div>
                                                                    <div className="md:col-span-2 space-y-2">
                                                                        <label className="text-sm font-bold text-slate-900">Description</label>
                                                                        <Textarea
                                                                            value={newControl.description}
                                                                            onChange={(e) => handleNewControlChange('description', e.target.value)}
                                                                            placeholder="Describe the control requirements and purpose..."
                                                                            className="min-h-[100px] border-slate-200 focus:ring-blue-500"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-end gap-3 pt-4">
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => setShowCustomControlForm(false)}
                                                                        className="border-slate-300"
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        onClick={handleCreateCustomControl}
                                                                        className="bg-blue-600 hover:bg-blue-700"
                                                                        disabled={createControlMutation.isPending}
                                                                    >
                                                                        {createControlMutation.isPending ? (
                                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                        ) : (
                                                                            <Plus className="h-4 w-4 mr-2" />
                                                                        )}
                                                                        Create Custom Control
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}

                                                {/* Controls Grid */}
                                                <div className="space-y-4">
                                                    {loadingControls || loadingSspControls ? (
                                                        <div className="text-center py-12">
                                                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                                                            <p className="text-slate-600">Loading controls...</p>
                                                        </div>
                                                    ) : controls && controls.length > 0 ? (
                                                        controls.map((control) => {
                                                            const sspControl = sspControls?.find(sc => sc.controlId === control.controlId);
                                                            const isSelected = !!sspControl;
                                                            return (
                                                                <div key={control.id} className="border border-slate-200 rounded-lg p-4 space-y-4">
                                                                    <div className="flex items-start justify-between">
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={isSelected}
                                                                                    onChange={(e) => handleControlToggle(control.controlId, e.target.checked)}
                                                                                    className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                                                                />
                                                                                <label className="font-bold text-slate-900 cursor-pointer">
                                                                                    {control.controlId} - {control.name}
                                                                                </label>
                                                                                {control.category && (
                                                                                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                                                                        {control.category}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-sm text-slate-600 ml-6">
                                                                                {control.description || 'No description available.'}
                                                                            </p>
                                                                        </div>
                                                                        <select
                                                                            value={sspControl?.implementationStatus || ''}
                                                                            onChange={(e) => handleControlStatusChange(control.controlId, e.target.value)}
                                                                            className="border border-slate-200 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                        >
                                                                            <option value="">Select status</option>
                                                                            <option value="implemented">Implemented</option>
                                                                            <option value="partial">Partially Implemented</option>
                                                                            <option value="planned">Planned</option>
                                                                            <option value="not-applicable">Not Applicable</option>
                                                                        </select>
                                                                    </div>

                                                                    {isSelected && (
                                                                        <div className="ml-6 space-y-3">
                                                                            <div className="space-y-2">
                                                                                <label className="text-sm font-bold text-slate-900">Implementation Details</label>
                                                                                <Textarea
                                                                                    value={sspControl?.implementationDescription || ''}
                                                                                    onChange={(e) => handleControlDetailsChange(control.controlId, 'implementationDescription', e.target.value)}
                                                                                    placeholder="Describe how this control is implemented, including tools, processes, and configuration details..."
                                                                                    className="min-h-[100px] border-slate-200 focus:ring-blue-500 text-sm"
                                                                                />
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                <label className="text-sm font-bold text-slate-900">Responsible Role</label>
                                                                                <Input
                                                                                    value={sspControl?.responsibleRole || ''}
                                                                                    onChange={(e) => handleControlDetailsChange(control.controlId, 'responsibleRole', e.target.value)}
                                                                                    placeholder="e.g., Security Operations Team, System Administrator"
                                                                                    className="border-slate-200 focus:ring-blue-500"
                                                                                />
                                                                            </div>

                                                                            {/* Evidence Section */}
                                                                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                                                                <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                                                    <LinkIcon className="h-4 w-4 text-slate-500" />
                                                                                    Evidence & Artifacts
                                                                                </label>

                                                                                {/* Existing Evidence List */}
                                                                                {sspControl?.evidenceLinks && (sspControl.evidenceLinks as any[]).length > 0 && (
                                                                                    <div className="space-y-2 mb-3">
                                                                                        {(sspControl.evidenceLinks as any[]).map((evidence: any) => (
                                                                                            <div key={evidence.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded text-sm group">
                                                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                                                    <ExternalLink className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                                                                                    <a href={evidence.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">
                                                                                                        {evidence.name}
                                                                                                    </a>
                                                                                                </div>
                                                                                                <button
                                                                                                    onClick={() => handleRemoveEvidence(control.controlId, evidence.id)}
                                                                                                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                                >
                                                                                                    <Trash2 className="h-4 w-4" />
                                                                                                </button>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}

                                                                                {/* Add New Evidence */}
                                                                                <div className="flex gap-2">
                                                                                    <Input
                                                                                        id={`evidence-name-${control.controlId}`}
                                                                                        placeholder="Description (e.g. Policy Doc)"
                                                                                        className="flex-1 h-8 text-sm"
                                                                                    />
                                                                                    <Input
                                                                                        id={`evidence-url-${control.controlId}`}
                                                                                        placeholder="URL"
                                                                                        className="flex-1 h-8 text-sm"
                                                                                    />
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={() => {
                                                                                            const nameInput = document.getElementById(`evidence-name-${control.controlId}`) as HTMLInputElement;
                                                                                            const urlInput = document.getElementById(`evidence-url-${control.controlId}`) as HTMLInputElement;
                                                                                            if (nameInput.value && urlInput.value) {
                                                                                                handleAddEvidence(control.controlId, nameInput.value, urlInput.value);
                                                                                                nameInput.value = '';
                                                                                                urlInput.value = '';
                                                                                            } else {
                                                                                                toast.error("Please provide both description and URL");
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        Add Link
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
                                                            <div className="bg-blue-50 p-4 rounded-full w-fit mx-auto mb-4">
                                                                <Shield className="h-10 w-10 text-blue-600" />
                                                            </div>
                                                            <h3 className="font-bold text-slate-900 mb-2">No Controls Found</h3>
                                                            <p className="text-slate-600 max-w-md mx-auto">
                                                                No NIST 800-172 controls found in the database. You can add custom controls using the button above.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Implementation Summary */}
                                                <Card className="border-slate-200 bg-blue-50/50 border-l-4 border-l-blue-600">
                                                    <CardContent className="p-6">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-3">
                                                                <Info className="h-5 w-5 text-blue-600" />
                                                                <h3 className="font-bold text-blue-900">Implementation Summary</h3>
                                                            </div>
                                                            <Textarea
                                                                placeholder="Provide an overall summary of security controls implementation, including any gaps, compensating controls, or future enhancement plans..."
                                                                className="min-h-[120px] border-blue-200 focus:ring-blue-500 bg-white"
                                                            />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                {/* Roles & Responsibilities */}
                                <TabsContent value="roles" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="space-y-2 mb-8">
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">5. Roles & Responsibilities</h2>
                                        <p className="text-slate-500">Define who is responsible for system security.</p>
                                    </div>

                                    <Card className="border-slate-200 shadow-sm">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg font-bold text-slate-900">Security Roles</CardTitle>
                                            <CardDescription>Personnel responsible for system security</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-900">Roles Description</label>
                                                    <Textarea
                                                        placeholder="Describe system owner, ISSO, administrators, users, and their responsibilities..."
                                                        value={sectionData['roles']?.rolesDescription || ''}
                                                        onChange={(e) => updateField('roles', 'rolesDescription', e.target.value)}
                                                        className="min-h-[200px] border-slate-200 focus:ring-blue-500 leading-relaxed py-4"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="flex justify-end">
                                        <Button
                                            onClick={() => handleSaveSection('roles')}
                                            disabled={isSaving}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4 mr-2" />
                                            )}
                                            Save Roles
                                        </Button>
                                    </div>
                                </TabsContent>

                                {/* Attachments & References */}
                                <TabsContent value="attachments" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="space-y-2 mb-8">
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">6. Attachments & References</h2>
                                        <p className="text-slate-500">Supporting documentation and references.</p>
                                    </div>

                                    <Card className="border-slate-200 shadow-sm">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg font-bold text-slate-900">Supporting Documentation</CardTitle>
                                            <CardDescription>References, policies, and additional documentation</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-900">Attachments & Notes</label>
                                                    <Textarea
                                                        placeholder="List supporting documents, policies, procedures, and any additional notes..."
                                                        value={sectionData['attachments']?.attachmentsNotes || ''}
                                                        onChange={(e) => updateField('attachments', 'attachmentsNotes', e.target.value)}
                                                        className="min-h-[200px] border-slate-200 focus:ring-blue-500 leading-relaxed py-4"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="flex justify-end">
                                        <Button
                                            onClick={() => handleSaveSection('attachments')}
                                            disabled={isSaving}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4 mr-2" />
                                            )}
                                            Save Attachments
                                        </Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div >
            </div >
        </DashboardLayout >
    );
}