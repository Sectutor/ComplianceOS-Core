import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Input } from "@complianceos/ui/ui/input";
import { Badge } from "@complianceos/ui/ui/badge";
import { Button } from "@complianceos/ui/ui/button";
import {
    Search,
    Shield,
    FileText,
    ClipboardCheck,
    ChevronDown,
    ChevronRight,
    BookOpen,
    CheckCircle2,
    Circle,
    AlertCircle,
    Download,
    Filter,
    LayoutList,
    Database,
    FileCheck
} from "lucide-react";
import { useLocation } from "wouter";
import { useClientContext } from "@/contexts/ClientContext";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@complianceos/ui/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Progress } from "@complianceos/ui/ui/progress";

interface Framework {
    id: string;
    name: string;
    controlCount: number;
    policyCount: number;
    evidenceCount: number;
    hasEvidenceSeed: boolean;
}

interface Control {
    id: number;
    controlId: string;
    name: string;
    description: string;
    category: string;
    framework: string;
    implementationGuidance?: string;
}

interface Policy {
    id: number;
    templateId: string;
    name: string;
    description?: string;
    sections: any[];
    frameworks: string[];
}

interface Evidence {
    id: string;
    title: string;
    description: string;
    location: string;
}

interface RequirementsData {
    framework: string;
    summary: {
        totalControls: number;
        totalPolicies: number;
        totalEvidence: number;
        categories: number;
    };
    controls: Record<string, Control[]>;
    policies: Policy[];
    evidence: Evidence[];
}

export default function ComplianceRequirementsPage() {
    const [location, setLocation] = useLocation();
    const { selectedClient } = useClientContext();
    const { user } = useAuth();
    const [selectedFramework, setSelectedFramework] = useState<string>("");
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<string>("controls");
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch available frameworks
    const { data: frameworksData, isLoading: frameworksLoading } = trpc.requirements.listFrameworks.useQuery({
        clientId: selectedClient?.id
    });

    // Fetch requirements for selected framework
    const { data: requirementsData, isLoading: requirementsLoading } = trpc.requirements.getFrameworkRequirements.useQuery(
        {
            framework: selectedFramework,
            clientId: selectedClient?.id
        },
        { enabled: !!selectedFramework }
    );

    const frameworks: Framework[] = frameworksData || [];

    // Filter controls based on search
    const filteredControls = requirementsData?.controls
        ? Object.entries(requirementsData.controls).reduce((acc, [category, controls]) => {
            const filtered = controls.filter(c =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.controlId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (filtered.length > 0) {
                acc[category] = filtered;
            }
            return acc;
        }, {} as Record<string, Control[]>)
        : {};

    // Filter policies based on search
    const filteredPolicies = requirementsData?.policies?.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.templateId.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    // Filter evidence based on search
    const filteredEvidence = requirementsData?.evidence?.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const toggleCategory = (category: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };

    const handleFrameworkChange = (value: string) => {
        setSelectedFramework(value);
        setExpandedCategories(new Set());
        setSearchQuery("");
    };

    const getCategoryIcon = (category: string) => {
        const lower = category.toLowerCase();
        if (lower.includes('management') || lower.includes('organizational')) return <Shield className="h-4 w-4" />;
        if (lower.includes('access') || lower.includes('control')) return <Shield className="h-4 w-4" />;
        if (lower.includes('crypt') || lower.includes('encryption')) return <Shield className="h-4 w-4" />;
        if (lower.includes('physical')) return <Shield className="h-4 w-4" />;
        if (lower.includes('operation') || lower.includes('process')) return <Shield className="h-4 w-4" />;
        return <BookOpen className="h-4 w-4" />;
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Compliance Requirements Template</h1>
                            <p className="text-slate-500 mt-1">
                                View all requirements, controls, policies, and evidence needed for compliance frameworks
                            </p>
                        </div>
                    </div>

                    <Breadcrumb
                        items={[
                            { label: "Dashboard", href: selectedClient ? `/clients/${selectedClient.id}` : "/" },
                            { label: "Compliance Requirements" }
                        ]}
                    />
                </div>

                {/* Framework Selector */}
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <div className="flex-1 w-full md:w-auto">
                                <label className="text-sm font-medium text-slate-700 mb-2 block">
                                    Select Compliance Framework
                                </label>
                                <Select
                                    value={selectedFramework}
                                    onValueChange={handleFrameworkChange}
                                    disabled={frameworksLoading}
                                >
                                    <SelectTrigger className="w-full md:w-[400px] bg-white">
                                        <SelectValue placeholder="Choose a framework..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {frameworks.map((fw) => (
                                            <SelectItem key={fw.id} value={fw.name}>
                                                <div className="flex items-center justify-between w-full">
                                                    <span>{fw.name}</span>
                                                    <div className="flex gap-2 ml-4">
                                                        {fw.controlCount > 0 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {fw.controlCount} controls
                                                            </Badge>
                                                        )}
                                                        {fw.policyCount > 0 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {fw.policyCount} policies
                                                            </Badge>
                                                        )}
                                                        {fw.evidenceCount > 0 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {fw.evidenceCount} evidence
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedFramework && requirementsData && (
                                <div className="flex gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Database className="h-4 w-4 text-blue-500" />
                                        <span className="font-medium">{requirementsData.summary.totalControls}</span>
                                        <span className="text-slate-500">Controls</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-emerald-500" />
                                        <span className="font-medium">{requirementsData.summary.totalPolicies}</span>
                                        <span className="text-slate-500">Policies</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ClipboardCheck className="h-4 w-4 text-amber-500" />
                                        <span className="font-medium">{requirementsData.summary.totalEvidence}</span>
                                        <span className="text-slate-500">Evidence</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content */}
                {selectedFramework && requirementsData ? (
                    <div className="space-y-6">
                        {/* Search and Tabs */}
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search requirements..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-white"
                                />
                            </div>

                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                                <TabsList className="bg-white border border-slate-200">
                                    <TabsTrigger value="controls" className="gap-2">
                                        <LayoutList className="h-4 w-4" />
                                        Controls
                                        <Badge variant="secondary" className="ml-1 text-xs">
                                            {Object.values(filteredControls).flat().length}
                                        </Badge>
                                    </TabsTrigger>
                                    <TabsTrigger value="policies" className="gap-2">
                                        <FileText className="h-4 w-4" />
                                        Policies
                                        <Badge variant="secondary" className="ml-1 text-xs">
                                            {filteredPolicies.length}
                                        </Badge>
                                    </TabsTrigger>
                                    <TabsTrigger value="evidence" className="gap-2">
                                        <FileCheck className="h-4 w-4" />
                                        Evidence
                                        <Badge variant="secondary" className="ml-1 text-xs">
                                            {filteredEvidence.length}
                                        </Badge>
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Controls Tab */}
                        {activeTab === "controls" && (
                            <div className="space-y-4">
                                {Object.entries(filteredControls).map(([category, controls]) => (
                                    <Card key={category} className="bg-white/80 backdrop-blur-sm border-slate-200 overflow-hidden">
                                        <CardHeader
                                            className="py-3 px-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                            onClick={() => toggleCategory(category)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {expandedCategories.has(category) ? (
                                                        <ChevronDown className="h-5 w-5 text-slate-400" />
                                                    ) : (
                                                        <ChevronRight className="h-5 w-5 text-slate-400" />
                                                    )}
                                                    {getCategoryIcon(category)}
                                                    <CardTitle className="text-base font-semibold">{category}</CardTitle>
                                                </div>
                                                <Badge variant="outline">{controls.length} controls</Badge>
                                            </div>
                                        </CardHeader>

                                        {expandedCategories.has(category) && (
                                            <CardContent className="pt-0 pb-2">
                                                <div className="divide-y divide-slate-100">
                                                    {controls.map((control) => (
                                                        <div
                                                            key={control.id}
                                                            className="py-3 px-4 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className="mt-1">
                                                                    <Circle className="h-4 w-4 text-slate-300" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                                                                            {control.controlId}
                                                                        </code>
                                                                    </div>
                                                                    <h4 className="font-medium text-slate-900 text-sm">
                                                                        {control.name}
                                                                    </h4>
                                                                    {control.description && (
                                                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                                                            {control.description}
                                                                        </p>
                                                                    )}
                                                                    {control.implementationGuidance && (
                                                                        <div className="mt-2 text-xs text-slate-400 bg-slate-50 p-2 rounded">
                                                                            <strong>Guidance:</strong> {control.implementationGuidance}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        )}
                                    </Card>
                                ))}

                                {Object.keys(filteredControls).length === 0 && (
                                    <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                                        <CardContent className="py-12 text-center">
                                            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-500">No controls found matching your search.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Policies Tab */}
                        {activeTab === "policies" && (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredPolicies.map((policy) => (
                                    <Card key={policy.id} className="bg-white/80 backdrop-blur-sm border-slate-200 hover:border-emerald-300 transition-colors">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5 text-emerald-500" />
                                                    <CardTitle className="text-sm font-semibold line-clamp-2">
                                                        {policy.name}
                                                    </CardTitle>
                                                </div>
                                            </div>
                                            <CardDescription className="text-xs">
                                                ID: {policy.templateId}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {policy.description && (
                                                <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
                                                    {policy.description.replace(/<\/?[^>]+(>|$)/g, "")}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {policy.frameworks?.slice(0, 3).map((fw, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-xs">
                                                        {fw}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                {policy.sections?.length || 0} sections
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}

                                {filteredPolicies.length === 0 && (
                                    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 md:col-span-2 lg:col-span-3">
                                        <CardContent className="py-12 text-center">
                                            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-500">No policies found for this framework.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Evidence Tab */}
                        {activeTab === "evidence" && (
                            <div className="space-y-4">
                                {filteredEvidence.map((item) => (
                                    <Card key={item.id} className="bg-white/80 backdrop-blur-sm border-slate-200">
                                        <CardContent className="py-4">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1">
                                                    <Circle className="h-5 w-5 text-amber-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <code className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-mono">
                                                            {item.id}
                                                        </code>
                                                    </div>
                                                    <h4 className="font-semibold text-slate-900">
                                                        {item.title}
                                                    </h4>
                                                    <p className="text-sm text-slate-500 mt-1">
                                                        {item.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            Location: {item.location}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {filteredEvidence.length === 0 && (
                                    <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                                        <CardContent className="py-12 text-center">
                                            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-500">No evidence requirements found for this framework.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    // Empty State
                    <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                        <CardContent className="py-16 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                                <Shield className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                Select a Framework
                            </h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Choose a compliance framework from the dropdown above to view all required controls, policies, and evidence documentation.
                            </p>
                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                {["ISO 27001", "SOC 2", "HIPAA", "NIST SP 800-53", "FedRAMP"].map((fw) => (
                                    <Badge
                                        key={fw}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-slate-50"
                                        onClick={() => handleFrameworkChange(fw)}
                                    >
                                        {fw}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Loading State */}
                {requirementsLoading && (
                    <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                        <CardContent className="py-12 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                            <p className="text-slate-500">Loading requirements...</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}

