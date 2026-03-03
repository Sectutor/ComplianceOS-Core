import { useState, useMemo } from "react";
import { useParams, Redirect, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getRegulation } from "@/data/regulations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown, ExternalLink, Activity, CheckCircle2, Link, Shield, Info, PieChart, BarChart3, AlertTriangle, FileText, Sparkles, Wand2, Paperclip, Plus, Target, Microscope, LayoutList, ClipboardCheck, FileCheck, Database, Search, Rocket, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@complianceos/ui/ui/tooltip";

import { LinkComplianceDialog } from "@/components/regulations/LinkComplianceDialog";
import { getFramework } from "@/data/frameworks";
import { iso27001Controls } from "@/data/frameworks/iso27001";
import { soc2Controls } from "@/data/frameworks/soc2";
import { nist800171Controls } from "@/data/frameworks/nist-800-171";

const staticFrameworks: Record<string, any[]> = {
    'iso-27001': iso27001Controls,
    'iso27001': iso27001Controls,
    'soc-2': soc2Controls,
    'soc2': soc2Controls,
    'nist-800-171': nist800171Controls,
};

export default function RegulationDetail() {
    const [location, setLocation] = useLocation();
    const params = useParams<{ id: string; regId: string }>();
    const regId = params.regId;
    const clientId = params.id ? parseInt(params.id) : 1;

    if (!regId) return <Redirect to={`/clients/${clientId}/compliance-obligations`} />;

    const regulation = getRegulation(regId);
    const framework = getFramework(regId);

    const item = regulation || framework;
    const isFramework = !!framework;

    // Handle not found
    if (!item) return <Redirect to="/404" />;

    const frameworkMap: Record<string, string> = {
        'GDPR': 'gdpr', 'HIPAA': 'hipaa', 'ISO 27001': 'iso-27001', 'SOC 2': 'soc-2',
        'NIST SP 800-53': 'nist-800-53', 'NIST CSF': 'nist-csf', 'PCI DSS': 'pci-dss-v4',
        'FedRAMP': 'fedramp-moderate', 'CCPA': 'ccpa', 'LGPD': 'lgpd',
    };
    const frameworkId = frameworkMap[item?.name || ''] || item?.id || item?.name?.toLowerCase().replace(/\s+/g, '-');

    const { data: requirementsData, isLoading: isReqLoading } = trpc.requirements.getFrameworkRequirements.useQuery(
        { framework: frameworkId || '', clientId },
        { enabled: !!frameworkId && isFramework }
    );

    const baseArticles = useMemo(() => {
        if (!isFramework) return item?.articles || [];

        let controlsData: Record<string, any[]> = {};
        const fid = item?.id?.toLowerCase() || regId?.toLowerCase() || '';
        console.log('RegulationDetail Debug:', { regId, fid, hasStatic: !!staticFrameworks[fid], isFramework });

        // Initial fallback from static data
        if (staticFrameworks[fid]) {
            const grouped: Record<string, any[]> = {};
            staticFrameworks[fid].forEach(c => {
                const cat = c.category || 'General';
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push(c);
            });
            controlsData = grouped;
        }

        // Backend override
        if (requirementsData?.controls && Object.keys(requirementsData.controls).length > 0) {
            controlsData = requirementsData.controls;
        }

        if (Object.keys(controlsData).length === 0) {
            return [];
        }

        return Object.entries(controlsData).map(([category, controls], idx) => ({
            id: `cat-${idx}-${category.replace(/\s+/g, '-')}`,
            numericId: `Domain`,
            title: category,
            description: `Controls related to ${category}`,
            subArticles: (controls as any[]).map(c => ({
                id: c.controlId || c.id,
                numericId: c.controlId || c.id,
                title: c.name,
                description: c.description + (c.implementationGuidance ? `\n\nGuidance: ${c.implementationGuidance}` : ''),
                mappedControls: { [frameworkId]: [c.controlId || c.id] }
            }))
        }));
    }, [isFramework, requirementsData, frameworkId, regId, item?.articles]);

    const allItems = baseArticles.flatMap((a: any) => [a, ...(a.subArticles || [])]);
    const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
    const activeArticle: any = allItems.find((a: any) => a.id === activeArticleId) || baseArticles?.[0] || {};

    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Direct Links Query
    const { data: directLinks } = trpc.regulations.getArticleLinks.useQuery({
        clientId: clientId, // Dynamic
        regulationId: regId,
        articleId: activeArticleId || ''
    }, {
        enabled: !!regId && !!activeArticleId
    });

    // AI Suggestions State
    const [suggestionState, setSuggestionState] = useState<{
        loading: boolean;
        articleId: string | null;
        matches: { controlId: string, reason: string }[] | null;
    }>({ loading: false, articleId: null, matches: null });

    /*
    const suggestMutation = trpc.ai.suggestMismatch.useMutation({
        onSuccess: (data: any) => {
            setSuggestionState(prev => ({ ...prev, loading: false, matches: data.matches }));
        },
        onError: (err: any) => {
            setSuggestionState(prev => ({ ...prev, loading: false }));
            toast.error("Failed to generate suggestions: " + err.message);
        }
    });
    */

    const handleSuggest = (article: any) => {
        setSuggestionState({ loading: true, articleId: article.id, matches: null });
        /*
        suggestMutation.mutate({
            articleId: article.numericId,
            title: article.title,
            description: article.description
        });
        */
        toast.info("AI suggestions are currently being upgraded. Check back soon!");
        setSuggestionState(prev => ({ ...prev, loading: false }));
    };



    // Mock definitions for the mapped controls
    const controlDefinitions: Record<string, any> = useMemo(() => {
        const defs: Record<string, any> = {
            // Default NIST 800-53 & General mappings
            "AC-2": {
                title: "Account Management",
                description: "The organization manages information system accounts, including establishing, activating, modifying, reviewing, disabling, and removing accounts.",
                guidance: "Use a centralized IAM system like Azure AD or Okta."
            },
            "AC-3": {
                title: "Access Enforcement",
                description: "The information system enforces approved authorizations for logical access to information and system resources in accordance with applicable access control policies.",
                guidance: "Implement Role-Based Access Control (RBAC) across all systems."
            },
            "AT-2": {
                title: "Security Awareness Training",
                description: "The organization provides basic security awareness training to information system users.",
                guidance: "Conduct monthly security training and phishing simulations."
            },
            "AU-2": {
                title: "Audit Events",
                description: "The organization determines that the information system is capable of auditing the following events: [Assignment: organization-defined audit events].",
                guidance: "Configure SIEM to collect logs from servers, firewalls, and cloud providers."
            },
            "CA-2": {
                title: "Security Assessments",
                description: "The organization assesses the security controls in the information system to determine if they are effective.",
                guidance: "Perform annual penetration tests and vulnerability assessments."
            },
            "CM-8": {
                title: "Information System Component Inventory",
                description: "The organization develops and documents an inventory of information system components.",
                guidance: "Maintain an automated asset inventory that tracks hardware, software, and data assets."
            },
            "CP-2": {
                title: "Contingency Plan",
                description: "The organization develops a contingency plan for the information system that identifies essential missions and business functions.",
                guidance: "Create a Business Continuity Plan (BCP) and Disaster Recovery Plan (DRP) and test them annually."
            },
            "IA-8": {
                title: "Identification and Authentication (Non-Organizational Users)",
                description: "The information system uniquely identifies and authenticates non-organizational users.",
                guidance: "Implement strict identity verification for customers, partners, or minors (e.g. for child consent)."
            },
            "IR-6": {
                title: "Incident Reporting",
                description: "The organization requires personnel to report suspected security incidents to the organizational incident response capability.",
                guidance: "Set up a clear reporting channel (e.g., email alias, ticket system) for security incidents."
            },
            "MP-4": {
                title: "Media Storage",
                description: "The organization physically controls and securely stores information system media within defined controlled areas.",
                guidance: "Encrypt sensitive data at rest and restrict physical access to storage media."
            },
            "MP-6": {
                title: "Media Sanitization",
                description: "The organization sanitizes information system media prior to disposal or reuse.",
                guidance: "Use NIST-approved sanitization methods (clear, purge, destroy) before discarding hard drives."
            },
            "PM-1": {
                title: "Information Security Program Plan",
                description: "The organization develops and disseminates an organization-wide information security program plan.",
                guidance: "Appoint a CISO or DPO to oversee the security program."
            },
            "PM-2": {
                title: "Senior Information Security Officer",
                description: "The organization appoints a senior information security officer with the mission and resources to coordinate the security program.",
                guidance: "Ensure the DPO/CISO has direct access to executive leadership."
            },
            "PS-1": {
                title: "Personnel Security Policy",
                description: "The organization develops, documents, and disseminates a personnel security policy.",
                guidance: "Include security requirements in job descriptions and employee contracts."
            },
            "PT-2": {
                title: "Authority to Collect",
                description: "The organization determines the authority to collect personally identifiable information and restricts collection to only that PII which is legally authorized and necessary.",
                guidance: "Only collect what you strictly need (Data Minimization)."
            },
            "PT-5": {
                title: "Privacy Notice",
                description: "The organization provides effective notice to the public and to individuals regarding its privacy activities.",
                guidance: "Publish a clear, accessible Privacy Policy on your website."
            },
            "RA-1": {
                title: "Risk Assessment Policy",
                description: "The organization develops, documents, and disseminates a risk assessment policy.",
                guidance: "Define your risk appetite and the methodology for scoring risks."
            },
            "RA-3": {
                title: "Risk Assessment",
                description: "The organization conducts an assessment of risk, including the likelihood and magnitude of harm.",
                guidance: "Conduct a DPIA (Data Protection Impact Assessment) for high-risk processing activities."
            },
            "SA-8": {
                title: "Security Engineering Principles",
                description: "The organization applies information system security engineering principles in the specification, design, development, implementation, and modification of the information system.",
                guidance: "Adopt 'Privacy by Design' and 'Security by Default' principles in your SDLC."
            },
            "SA-9": {
                title: "External Information System Services",
                description: "The organization requires that providers of external information system services employ adequate security controls.",
                guidance: "Vet vendors and processors (Third-Party Risk Management) before sharing data."
            },
            "SC-1": {
                title: "System and Communications Protection Policy",
                description: "The organization develops, documents, and disseminates a system and communications protection policy.",
                guidance: "Define standards for encryption, key management, and network segregation."
            },
            "SC-7": {
                title: "Boundary Protection",
                description: "The information system monitors and controls communications at the external boundary of the system.",
                guidance: "Use firewalls, IDS/IPS, and web proxies to inspect traffic entering and leaving your network."
            },
            "SI-4": {
                title: "Information System Monitoring",
                description: "The organization monitors the information system to detect attacks and indicators of potential attacks.",
                guidance: "Implement continuous monitoring to detect anomalies and unauthorized erasure attempts."
            }
        };

        // Populate from imported framework data for completeness
        iso27001Controls.forEach(c => {
            defs[c.id] = {
                title: c.name,
                description: c.description,
                guidance: c.implementationGuidance || "Follow ISO 27001 implementation best practices."
            };
        });

        soc2Controls.forEach(c => {
            defs[c.id] = {
                title: c.name,
                description: c.description,
                guidance: c.implementationGuidance || "Establish trust services criteria compliance."
            };
        });

        nist800171Controls.forEach(c => {
            defs[c.id] = {
                title: c.name,
                description: c.description,
                guidance: c.implementationGuidance || "Meet CUI protection requirements."
            };
        });

        return defs;
    }, []);

    const [selectedControl, setSelectedControl] = useState<{ id: string, framework: string } | null>(null);
    const [showGapsDialog, setShowGapsDialog] = useState(false);

    // Helper to handle legacy array mappings vs new object mappings
    const getNormalizedMappings = (mappings?: string[] | Record<string, string[]>) => {
        if (!mappings) return {};
        if (Array.isArray(mappings)) {
            return { "NIST 800-53": mappings };
        }
        return mappings;
    };

    // Calculate Coverage Stats
    const totalArticles = allItems.length;
    const mappedArticles = allItems.filter(item => item.mappedControls).length;
    const coveragePercentage = totalArticles > 0 ? Math.round((mappedArticles / totalArticles) * 100) : 0;
    const unmappedArticles = totalArticles - mappedArticles;

    const frameworkStats: Record<string, number> = {};
    allItems.forEach(item => {
        const mappings = getNormalizedMappings(item.mappedControls);
        Object.keys(mappings).forEach(fw => {
            frameworkStats[fw] = (frameworkStats[fw] || 0) + 1;
        });
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <Breadcrumb items={[
                    { label: "Compliance Obligations", href: `/clients/${clientId}/compliance-obligations` },
                    { label: item?.name || "Regulation Detail" }
                ]} />

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold">{item?.name}</h1>
                        <p className="text-muted-foreground">{item?.description}</p>
                    </div>
                    {item?.type && <Badge variant="secondary" className="bg-white border border-slate-200 text-slate-700 font-semibold shadow-sm hover:bg-slate-50 px-3 py-1 text-xs uppercase tracking-wider">{item?.type}</Badge>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                    <Card
                        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white border border-white/40 bg-white/60 backdrop-blur-xl shadow-premium rounded-2xl group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        onClick={() => setLocation(`/clients/${clientId}/compliance-obligations`)}
                    >
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-800 tracking-tight">All Regulations</p>
                            <p className="text-xs font-medium text-slate-500">View all frameworks</p>
                        </div>
                    </Card>

                    <Card
                        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white border border-white/40 bg-white/60 backdrop-blur-xl shadow-premium rounded-2xl group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        onClick={() => setLocation(`/clients/${clientId}/roadmap`)}
                    >
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                            <Rocket className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-800 tracking-tight">Compliance Roadmap</p>
                            <p className="text-xs font-medium text-slate-500">Strategic milestones</p>
                        </div>
                    </Card>

                    <Card
                        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white border border-white/40 bg-white/60 backdrop-blur-xl shadow-premium rounded-2xl group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        onClick={() => setLocation(`/clients/${clientId}/risks`)}
                    >
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform duration-300">
                            <Target className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-800 tracking-tight">Risk Register</p>
                            <p className="text-xs font-medium text-slate-500">High-impact threats</p>
                        </div>
                    </Card>

                    <Card
                        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white border border-white/40 bg-white/60 backdrop-blur-xl shadow-premium rounded-2xl group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        onClick={() => setLocation(`/clients/${clientId}/controls`)}
                    >
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                            <Shield className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-800 tracking-tight">Internal Controls</p>
                            <p className="text-xs font-medium text-slate-500">Satisfying obligations</p>
                        </div>
                    </Card>
                </div>

                <Tabs defaultValue="guide" className="flex flex-col">
                    <TabsList className="w-full justify-start h-auto p-1 bg-muted rounded-md mb-4 gap-1">
                        <TabsTrigger value="guide" className="px-4 py-2">
                            Regulation Guide
                        </TabsTrigger>
                        <TabsTrigger value="crosswalk" className="px-4 py-2">
                            Control Cross-Walk
                        </TabsTrigger>
                        <TabsTrigger value="coverage" className="px-4 py-2">
                            Coverage Analysis
                        </TabsTrigger>
                        <TabsTrigger value="requirements" className="px-4 py-2 gap-1">
                            <LayoutList className="h-4 w-4" />
                            Requirements
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="guide" className="mt-4">
                        <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                            {/* Sidebar: Articles List */}
                            <Card className={cn(
                                "flex flex-col h-full border-r-0 lg:border-r rounded-none lg:rounded-lg shadow-none lg:shadow-sm transition-all duration-300 overflow-hidden",
                                isSidebarCollapsed ? "w-full lg:w-14" : "w-full lg:w-96"
                            )}>
                                <CardHeader className={cn(
                                    "pb-3 border-b flex flex-row items-center justify-between",
                                    isSidebarCollapsed ? "px-2" : "px-4"
                                )}>
                                    {!isSidebarCollapsed && (
                                        <CardTitle className="text-lg whitespace-nowrap overflow-hidden text-ellipsis">
                                            {isFramework ? "Domains & Controls" : "Articles"}
                                        </CardTitle>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0"
                                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                    >
                                        {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                                    </Button>
                                </CardHeader>
                                <ScrollArea className="flex-1">
                                    <div className={cn("p-2 space-y-1", isSidebarCollapsed && "px-1")}>
                                        <TooltipProvider delayDuration={0}>
                                            {baseArticles.map((article: any) => (
                                                <div key={article.id} className="space-y-1 mb-2">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant={activeArticleId === article.id ? "secondary" : "ghost"}
                                                                className={cn(
                                                                    "w-full justify-start text-left h-auto py-3 whitespace-normal transition-all",
                                                                    activeArticleId === article.id ? "bg-secondary font-medium border border-primary/20" : "",
                                                                    isSidebarCollapsed ? "px-0 justify-center" : "px-3"
                                                                )}
                                                                onClick={() => setActiveArticleId(article.id)}
                                                            >
                                                                <div className={cn(
                                                                    "flex items-start w-full",
                                                                    isSidebarCollapsed ? "justify-center" : "gap-3"
                                                                )}>
                                                                    <Badge variant="outline" className={cn(
                                                                        "mt-0.5 shrink-0 min-w-10 h-6 flex items-center justify-center p-0 px-1 text-[10px] font-bold",
                                                                        isSidebarCollapsed && "min-w-0 w-8"
                                                                    )}>
                                                                        {article.numericId === "Domain" ? (isFramework ? "D" : "A") : article.numericId}
                                                                    </Badge>
                                                                    {!isSidebarCollapsed && (
                                                                        <span className="text-sm leading-snug font-bold">{article.title}</span>
                                                                    )}
                                                                </div>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        {isSidebarCollapsed && (
                                                            <TooltipContent side="right">
                                                                <p className="font-bold">{article.title}</p>
                                                            </TooltipContent>
                                                        )}
                                                    </Tooltip>
                                                </div>
                                            ))}
                                        </TooltipProvider>
                                        {baseArticles.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                                                {!isSidebarCollapsed && <Info className="h-8 w-8 mx-auto mb-2 opacity-20" />}
                                                <p className="text-xs">{!isSidebarCollapsed ? "No domains found." : "Empty"}</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </Card>

                            {/* Main Content: Article Viewer */}
                            <div className="flex-1 h-full overflow-hidden flex flex-col">
                                {activeArticle ? (
                                    <Card className="h-full flex flex-col border-none shadow-md">
                                        <CardHeader className="border-b bg-muted/20 pb-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Badge>{item?.name} {activeArticle?.numericId ? `Article ${activeArticle?.numericId}` : 'Sub-Article'}</Badge>
                                                {item?.type && <Badge variant="outline">{item?.type}</Badge>}
                                            </div>
                                            <CardTitle className="text-2xl">{activeArticle.title}</CardTitle>
                                        </CardHeader>
                                        <ScrollArea className="flex-1">
                                            <CardContent className="p-6">
                                                <div className="prose prose-slate dark:prose-invert max-w-none">
                                                    <p className="text-lg leading-relaxed">{activeArticle.description}</p>

                                                    {activeArticle.subArticles && activeArticle.subArticles.length > 0 && (
                                                        <div className="mt-8 space-y-6">
                                                            <h3 className="text-sm font-semibold uppercase text-muted-foreground flex items-center gap-2">
                                                                <Microscope className="h-4 w-4" /> Sub-Articles & Details
                                                            </h3>
                                                            <div className="grid gap-4">
                                                                {activeArticle.subArticles.map((sub: any) => (
                                                                    <div
                                                                        key={sub.id}
                                                                        className="flex flex-col border-b pb-4 last:border-0 last:pb-0 gap-3"
                                                                    >
                                                                        <div className="flex justify-between items-start">
                                                                            <div className="flex items-center gap-2">
                                                                                <Badge variant="outline" className="text-xs font-mono">{sub.numericId}</Badge>
                                                                                <h4 className="font-semibold text-base">{sub.title}</h4>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-sm text-slate-600 line-clamp-3">{sub.description}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {activeArticle.mappedControls && (
                                                        <div className="mt-8 pt-8 border-t">
                                                            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-4 flex items-center gap-2">
                                                                <Link className="h-4 w-4" /> Mapped Controls
                                                            </h3>
                                                            {Object.entries(getNormalizedMappings(activeArticle.mappedControls)).map(([framework, controls]) => (
                                                                <div key={framework} className="mb-4 last:mb-0">
                                                                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">{framework}</h4>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {controls.map(ctrlId => (
                                                                            <Badge
                                                                                key={ctrlId}
                                                                                variant={framework.includes('NIST') ? "secondary" : "outline"}
                                                                                className="font-mono cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                                                                onClick={() => setSelectedControl({ id: ctrlId, framework })}
                                                                            >
                                                                                {ctrlId}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Direct Links Section */}
                                                    <div className="mt-8 pt-8 border-t">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h3 className="text-sm font-semibold uppercase text-muted-foreground flex items-center gap-2">
                                                                <Paperclip className="h-4 w-4" /> Evidence & Policies
                                                            </h3>
                                                            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => setLinkDialogOpen(true)}>
                                                                <Plus className="h-3 w-3" /> Link Item
                                                            </Button>
                                                        </div>

                                                        {directLinks && (
                                                            <div className="space-y-4">
                                                                {directLinks.policies.length > 0 && (
                                                                    <div>
                                                                        <h4 className="text-xs font-semibold text-muted-foreground mb-2">Linked Policies</h4>
                                                                        <div className="space-y-2">
                                                                            {directLinks.policies.map((p: any) => (
                                                                                <div
                                                                                    key={p.id}
                                                                                    className="flex items-center gap-2 text-sm p-2 border rounded bg-slate-50 hover:bg-slate-100 cursor-pointer group"
                                                                                    onClick={() => setLocation(`/clients/${clientId}/privacy/documents/${p.id}`)}
                                                                                >
                                                                                    <FileText className="h-3 w-3 text-blue-500" />
                                                                                    <span className="truncate flex-1 group-hover:text-blue-600 transition-colors font-medium">{p.name}</span>
                                                                                    <Badge variant="outline" className="text-[10px] bg-white">{p.status}</Badge>
                                                                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {directLinks.evidence.length > 0 && (
                                                                    <div>
                                                                        <h4 className="text-xs font-semibold text-muted-foreground mb-2">Linked Evidence</h4>
                                                                        <div className="space-y-2">
                                                                            {directLinks.evidence.map((e: any) => (
                                                                                <div
                                                                                    key={e.id}
                                                                                    className="flex items-center gap-2 text-sm p-2 border rounded bg-slate-50 hover:bg-slate-100 cursor-pointer group"
                                                                                    onClick={() => setLocation(`/clients/${clientId}/evidence`)}
                                                                                >
                                                                                    <Database className="h-3 w-3 text-orange-500" />
                                                                                    <span className="truncate flex-1 group-hover:text-orange-600 transition-colors font-medium">{e.title}</span>
                                                                                    <Badge variant="outline" className="text-[10px] bg-white">Linked</Badge>
                                                                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {directLinks.controls.length > 0 && (
                                                                    <div>
                                                                        <h4 className="text-xs font-semibold text-muted-foreground mb-2">Linked Client Controls</h4>
                                                                        <div className="space-y-2">
                                                                            {directLinks.controls.map((c: any) => (
                                                                                <div
                                                                                    key={c.id}
                                                                                    className="flex items-center gap-2 text-sm p-2 border rounded bg-slate-50 hover:bg-slate-100 cursor-pointer group"
                                                                                    onClick={() => setLocation(`/clients/${clientId}/controls`)}
                                                                                >
                                                                                    <Shield className="h-3 w-3 text-emerald-500" />
                                                                                    <span className="truncate flex-1 group-hover:text-emerald-600 transition-colors font-medium">{c.clientControlId} - {c.status}</span>
                                                                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {directLinks.policies.length === 0 && directLinks.evidence.length === 0 && directLinks.controls.length === 0 && (
                                                                    <p className="text-sm text-muted-foreground italic">No direct items linked to this article.</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </ScrollArea>
                                    </Card>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground p-8 text-center">
                                        Select an article from the sidebar to view detailed requirements and guidance.
                                    </div>
                                )}
                            </div>
                        </div>


                    </TabsContent>



                    <TabsContent value="crosswalk" className="mt-4 flex-1 h-full overflow-y-auto pb-20">
                        <Card>
                            <CardHeader>
                                <CardTitle>Control Cross-Walk (Multi-Framework)</CardTitle>
                                <CardDescription>View compliance mapping across multiple standards (NIST 800-53, ISO 27001).</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 flex items-start gap-3 text-blue-800">
                                        <Info className="h-5 w-5 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="font-semibold text-sm">
                                                Displaying {allItems.filter(a => a.mappedControls).length} of {allItems.length} Articles & Sub-Articles
                                            </p>
                                            <p className="text-sm opacity-90">
                                                This view filters to only show articles that have specific control mappings defined (NIST 800-53, ISO 27001, etc).
                                                Articles without direct control mappings (such as definitions or purely administrative clauses) are hidden from this view.
                                            </p>
                                        </div>
                                    </div>

                                    {allItems.filter(a => a.mappedControls).length > 0 ? (
                                        allItems.filter(a => a.mappedControls).map((item: any) => (
                                            <div key={item.id} className="flex flex-col border-b pb-4 last:border-0 last:pb-0 gap-3">
                                                <div>
                                                    <h4 className="font-semibold text-sm">Article {item.numericId || item.id}: {item.title}</h4>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {Object.entries(getNormalizedMappings(item.mappedControls)).map(([framework, controls]) => (
                                                        <div key={framework} className="flex items-center gap-3 text-sm">
                                                            <span className="w-24 shrink-0 text-muted-foreground text-xs font-semibold">{framework}</span>
                                                            <div className="flex gap-2 flex-wrap">
                                                                {controls.map((c: any) => (
                                                                    <Badge
                                                                        key={c}
                                                                        variant="outline"
                                                                        className="font-mono bg-muted/50 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                                                        onClick={() => setSelectedControl({ id: c, framework })}
                                                                    >
                                                                        {c}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground italic">No mappings defined for this regulation yet.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {activeArticleId && (
                        <LinkComplianceDialog
                            isOpen={linkDialogOpen}
                            onClose={() => setLinkDialogOpen(false)}
                            clientId={clientId}
                            regulationId={regId}
                            articleId={activeArticleId}
                            onSuccess={() => {
                                // Query auto-refreshes due to invalidation in dialog
                            }}
                        />
                    )}

                    <TabsContent value="coverage" className="mt-4 flex-1 h-full overflow-y-auto pb-20">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <Card className="bg-primary/5 border-primary/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Activity className="h-4 w-4" /> Overall Readiness
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{coveragePercentage}%</div>
                                    <p className="text-xs text-muted-foreground">{mappedArticles} of {totalArticles} articles covered</p>
                                    <div className="w-full bg-secondary h-2 rounded-full mt-3 overflow-hidden">
                                        <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${coveragePercentage}%` }} />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card
                                className="cursor-pointer hover:bg-muted/50 transition-colors border-orange-200"
                                onClick={() => setShowGapsDialog(true)}
                            >
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-orange-600" /> Compliance Gaps
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-orange-600">{unmappedArticles}</div>
                                    <p className="text-xs text-muted-foreground">Articles needing attention</p>
                                    <p className="text-[10px] text-muted-foreground mt-2 underline">Click to view details</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Shield className="h-4 w-4" /> Active Frameworks
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{Object.keys(frameworkStats).length}</div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {Object.keys(frameworkStats).map(fw => (
                                            <Badge key={fw} variant="outline" className="text-[10px]">{fw}</Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" /> Framework Contribution
                                    </CardTitle>
                                    <CardDescription>Number of articles covered by each framework.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {Object.entries(frameworkStats).map(([fw, count]) => (
                                            <div key={fw}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium">{fw}</span>
                                                    <span className="text-muted-foreground">{count} / {totalArticles}</span>
                                                </div>
                                                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                                                    <div className="bg-blue-600 h-full" style={{ width: `${(count / totalArticles) * 100}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" /> Unmapped Areas
                                    </CardTitle>
                                    <CardDescription>Top unaddressed articles.</CardDescription>
                                </CardHeader>
                                <ScrollArea className="h-[300px]">
                                    <CardContent>
                                        <div className="space-y-2">
                                            {baseArticles.filter((a: any) => !a.mappedControls).slice(0, 10).map((a: any) => (
                                                <div key={a.id} className="p-3 border rounded-md bg-muted/20 flex gap-3">
                                                    <Badge variant="outline" className="h-6 w-8 shrink-0 flex items-center justify-center p-0">{a.numericId}</Badge>
                                                    <div className="text-sm flex-1">
                                                        <p className="font-medium">{a.title}</p>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">{a.description}</p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 gap-1 text-[10px]"
                                                        onClick={() => setLocation(`/clients/${clientId}/implementation`)}
                                                    >
                                                        <Plus className="h-3 w-3" /> Remediate
                                                    </Button>
                                                </div>
                                            ))}
                                            {unmappedArticles > 10 && (
                                                <p className="text-center text-xs text-muted-foreground italic mt-4">
                                                    + {unmappedArticles - 10} more unmapped articles
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </ScrollArea>
                            </Card>
                        </div>

                        {/* Integration: Risk Alignment */}
                        <Card className="mt-6">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Target className="h-5 w-5 text-red-500" /> Risk Alignment
                                    </CardTitle>
                                    <CardDescription>Risks mitigated by controls mapped to this regulation.</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setLocation(`/clients/${clientId}/risks`)}>
                                    View Risk Register
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="p-4 border rounded-xl bg-red-50/50 flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="destructive">High Exposure</Badge>
                                            <AlertTriangle className="h-4 w-4 text-red-600" />
                                        </div>
                                        <h4 className="font-bold text-sm">Regulatory Non-Compliance Risk</h4>
                                        <p className="text-xs text-muted-foreground">Fines up to 4% of global turnover for Article 32 violations.</p>
                                        <div className="mt-auto pt-2 flex justify-between items-center">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Priority: Critical</span>
                                            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-red-700">Link to Mitigation</Button>
                                        </div>
                                    </div>

                                    <div className="p-4 border rounded-xl bg-blue-50/50 flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">Operational Risk</Badge>
                                            <Shield className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <h4 className="font-bold text-sm">Data Breach Impact</h4>
                                        <p className="text-xs text-muted-foreground">Reputational damage and customer churn post-breach.</p>
                                        <div className="mt-auto pt-2 flex justify-between items-center">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Status: Managed</span>
                                            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-blue-700">View Control</Button>
                                        </div>
                                    </div>

                                    <div className="p-4 border rounded-xl border-dashed flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center mb-2">
                                            <Plus className="h-4 w-4 text-slate-500" />
                                        </div>
                                        <p className="text-xs font-medium">Link New Risk Scenario</p>
                                        <p className="text-[10px] text-muted-foreground">Connect obligation to existing risk</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Requirements Tab Content */}
                    <TabsContent value="requirements" className="mt-4 flex-1 h-full overflow-y-auto pb-20">
                        <RequirementsTabContent clientId={clientId} regulation={item} />
                    </TabsContent>
                </Tabs>

                <EnhancedDialog
                    open={!!selectedControl}
                    onOpenChange={(open) => !open && setSelectedControl(null)}
                    title={
                        <div className="flex items-center justify-between w-full pr-8">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                {selectedControl?.id}
                            </div>
                            {selectedControl && <Badge variant="outline">{selectedControl.framework}</Badge>}
                        </div>
                    }
                    description="Common framework control definition."
                    footer={
                        <Button variant="outline" onClick={() => setSelectedControl(null)}>Close</Button>
                    }
                >
                    {selectedControl && controlDefinitions[selectedControl.id] ? (
                        <div className="space-y-4 py-4">
                            <div>
                                <h4 className="font-semibold text-lg">{controlDefinitions[selectedControl.id].title}</h4>
                                <p className="text-muted-foreground mt-1">{controlDefinitions[selectedControl.id].description}</p>
                            </div>
                            <div className="bg-muted/50 p-4 rounded-md">
                                <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                    <Activity className="h-4 w-4" /> Implementation Guidance
                                </h5>
                                <p className="text-sm">{controlDefinitions[selectedControl.id].guidance}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No detailed definition available for this control ID.</p>
                        </div>
                    )}
                </EnhancedDialog>

                <EnhancedDialog
                    open={showGapsDialog}
                    onOpenChange={setShowGapsDialog}
                    title={
                        <div className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="h-5 w-5" /> Unmapped Articles ({unmappedArticles})
                        </div>
                    }
                    description="The following articles currently have no controls mapped to them."
                    size="xl"
                    footer={
                        <Button onClick={() => setShowGapsDialog(false)}>Close</Button>
                    }
                >
                    <div className="space-y-3 py-4">
                        {baseArticles.filter((a: any) => !a.mappedControls).map((a: any) => (
                            <div key={a.id} className="p-4 border rounded-lg bg-orange-50/50 border-orange-100">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">Article {a.numericId}</Badge>
                                        <h4 className="font-semibold text-sm">{a.title}</h4>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-2"
                                        onClick={() => handleSuggest(a)}
                                        disabled={suggestionState.loading}
                                    >
                                        {suggestionState.loading && suggestionState.articleId === a.id ? (
                                            <Wand2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-4 w-4" />
                                        )}
                                        Suggest Mapping
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{a.description}</p>

                                {suggestionState.articleId === a.id && suggestionState.matches && (
                                    <div className="mt-3 p-3 bg-white border rounded-md shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <Sparkles className="h-3 w-3 text-blue-500" /> AI Suggested Controls
                                        </h5>
                                        <div className="space-y-2">
                                            {suggestionState.matches.map((match: any, idx: number) => (
                                                <div key={idx} className="flex gap-2 text-sm items-start p-2 bg-slate-50 rounded">
                                                    <Badge className="shrink-0">{match.controlId}</Badge>
                                                    <span className="text-slate-600 text-xs mt-0.5">{match.reason}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-end gap-2 mt-3">
                                            <Button size="sm" variant="outline" onClick={() => setSuggestionState({ loading: false, articleId: null, matches: null })}>Dimiss</Button>
                                            <Button size="sm" onClick={() => toast.success("This would save the mapping in a real implementation!")}>Accept Suggestion</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </EnhancedDialog>
            </div>
        </DashboardLayout>
    );
}

// Requirements Tab Content Component
function RequirementsTabContent({ clientId, regulation }: { clientId: number; regulation: any }) {
    const [requirementsSearch, setRequirementsSearch] = useState('');
    const [activeReqTab, setActiveReqTab] = useState('controls');
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    // Map regulation name to framework ID
    const frameworkMap: Record<string, string> = {
        'GDPR': 'gdpr',
        'HIPAA': 'hipaa',
        'ISO 27001': 'iso-27001',
        'SOC 2': 'soc-2',
        'NIST SP 800-53': 'nist-800-53',
        'NIST CSF': 'nist-csf',
        'PCI DSS': 'pci-dss-v4',
        'FedRAMP': 'fedramp-moderate',
        'CCPA': 'ccpa',
        'LGPD': 'lgpd',
    };

    // Get framework ID from regulation
    const frameworkId = frameworkMap[regulation?.name || ''] || regulation?.id || regulation?.name?.toLowerCase().replace(/\s+/g, '-');

    // Fetch requirements data
    const { data: requirementsData, isLoading } = trpc.requirements.getFrameworkRequirements.useQuery(
        { framework: frameworkId, clientId },
        { enabled: !!frameworkId }
    );

    const flatControls = useMemo(() => {
        let controls: any[] = [];
        const fid = regulation?.id || '';

        // Fallback to static data if backend is empty
        if (requirementsData?.controls && Object.keys(requirementsData.controls).length > 0) {
            controls = Object.values(requirementsData.controls).flat() as any[];
        } else if (staticFrameworks[fid]) {
            controls = staticFrameworks[fid];
        }

        return controls;
    }, [requirementsData, regulation?.id]);

    // Filter functions
    const filteredControls = useMemo(() => {
        const controls = flatControls;
        if (!requirementsSearch) return controls;
        const search = requirementsSearch.toLowerCase();
        return controls.filter((c: any) =>
            c.name?.toLowerCase().includes(search) ||
            c.controlId?.toLowerCase().includes(search) ||
            c.description?.toLowerCase().includes(search)
        );
    }, [flatControls, requirementsSearch]);

    const filteredPolicies = useMemo(() => {
        const policies = requirementsData?.policies || [];
        if (!requirementsSearch) return policies;
        const search = requirementsSearch.toLowerCase();
        return policies.filter((p: any) =>
            p.name?.toLowerCase().includes(search) ||
            p.templateId?.toLowerCase().includes(search)
        );
    }, [requirementsData, requirementsSearch]);

    const filteredEvidence = useMemo(() => {
        const evidence = requirementsData?.evidence || [];
        if (!requirementsSearch) return evidence;
        const search = requirementsSearch.toLowerCase();
        return evidence.filter((e: any) =>
            e.title?.toLowerCase().includes(search) ||
            e.description?.toLowerCase().includes(search)
        );
    }, [requirementsData, requirementsSearch]);

    const controlsByCategory = useMemo(() => {
        const grouped: Record<string, any[]> = {};
        if (!filteredControls || !Array.isArray(filteredControls)) return grouped;
        filteredControls.forEach((control: any) => {
            const cat = control.category || 'Other';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(control);
        });
        return grouped;
    }, [filteredControls]);

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading requirements...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search controls, policies, evidence..."
                    value={requirementsSearch}
                    onChange={(e) => setRequirementsSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Sub-tabs for Controls, Policies, Evidence */}
            <Tabs value={activeReqTab} onValueChange={setActiveReqTab}>
                <TabsList>
                    <TabsTrigger value="controls" className="gap-2">
                        <LayoutList className="h-4 w-4" />
                        Controls
                        <Badge variant="secondary" className="ml-1">{filteredControls.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="policies" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Policies
                        <Badge variant="secondary" className="ml-1">{filteredPolicies.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="evidence" className="gap-2">
                        <ClipboardCheck className="h-4 w-4" />
                        Evidence
                        <Badge variant="secondary" className="ml-1">{filteredEvidence.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                {/* Controls Tab */}
                <TabsContent value="controls" className="mt-4 space-y-4">
                    {Object.entries(controlsByCategory).map(([category, controls]) => (
                        <Card key={category}>
                            <button
                                onClick={() => toggleCategory(category)}
                                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                            >
                                <span className="font-semibold">{category}</span>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{controls.length} items</Badge>
                                    {expandedCategories[category] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </div>
                            </button>
                            {expandedCategories[category] && (
                                <div className="divide-y">
                                    {(controls as any[]).map((control: any) => (
                                        <div key={control.id} className="p-4 hover:bg-slate-50">
                                            <div className="flex items-start gap-3">
                                                <Badge variant="secondary" className="mt-0.5 shrink-0">{control.controlId}</Badge>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-sm">{control.name}</h4>
                                                    <p className="text-sm text-muted-foreground mt-1">{control.description}</p>
                                                    {control.implementationGuidance && (
                                                        <p className="text-xs text-primary mt-2">{control.implementationGuidance}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    ))}
                    {filteredControls.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <LayoutList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No controls found for {regulation?.name || 'this framework'}</p>
                        </div>
                    )}
                </TabsContent>

                {/* Policies Tab */}
                <TabsContent value="policies" className="mt-4 space-y-4">
                    {filteredPolicies.map((policy: any) => (
                        <div key={policy.id} className="p-4 border rounded-lg hover:bg-slate-50">
                            <div className="flex items-start gap-3">
                                <FileCheck className="h-5 w-5 text-blue-500 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm">{policy.name}</h4>
                                    {policy.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {policy.description.replace(/<\/?[^>]+(>|$)/g, "")}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline" className="text-[10px]">{policy.templateId}</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredPolicies.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No policies found for {regulation?.name || 'this framework'}</p>
                        </div>
                    )}
                </TabsContent>

                {/* Evidence Tab */}
                <TabsContent value="evidence" className="mt-4 space-y-4">
                    {filteredEvidence.map((evidence: any) => (
                        <div key={evidence.id} className="p-4 border rounded-lg hover:bg-slate-50">
                            <div className="flex items-start gap-3">
                                <Database className="h-5 w-5 text-orange-500 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm">{evidence.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">{evidence.description}</p>
                                    <p className="text-xs text-muted-foreground mt-2 font-mono bg-slate-100 p-1 rounded">
                                        Location: {evidence.location}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredEvidence.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No evidence requirements found for {regulation?.name || 'this framework'}</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}


