import { useState } from "react";
import { useParams, Redirect, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getRegulation } from "@/data/regulations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { cn } from "@/lib/utils";
import { ChevronRight, ExternalLink, Activity, CheckCircle2, Link, Shield, Info, PieChart, BarChart3, AlertTriangle, FileText, Sparkles, Wand2, Paperclip, Plus, Target, Microscope } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

import { LinkComplianceDialog } from "@/components/regulations/LinkComplianceDialog";

export default function RegulationDetail() {
    const [location, setLocation] = useLocation();
    const params = useParams<{ id: string; regId: string }>();
    const regId = params.regId;
    const clientId = params.id ? parseInt(params.id) : 1;

    if (!regId) return <Redirect to={`/clients/${clientId}/compliance-obligations`} />;

    const regulation = getRegulation(regId);

    // Handle not found
    if (!regulation) return <Redirect to="/404" />;

    const [activeArticleId, setActiveArticleId] = useState(regulation.articles[0]?.id);
    const activeArticle = regulation.articles.find(a => a.id === activeArticleId);

    const [linkDialogOpen, setLinkDialogOpen] = useState(false);

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
    const controlDefinitions: Record<string, { title: string, description: string, guidance: string }> = {
        // NIST 800-53
        "AC-1": {
            title: "Access Control Policy and Procedures",
            description: "The organization develops, documents, and disseminates to defined personnel or roles an access control policy.",
            guidance: "Ensure your Access Control Policy is reviewed annually and approved by management."
        },
        "AC-2": {
            title: "Account Management",
            description: "The organization identifies and selects the following types of information system accounts to support organizational missions/business functions.",
            guidance: "Implement automated mechanisms to audit account creation, modification, enabling, disabling, and removal actions."
        },
        "AC-3": {
            title: "Access Enforcement",
            description: "The information system enforces approved authorizations for logical access to information and system resources.",
            guidance: "Use Role-Based Access Control (RBAC) to restrict access based on job responsibilities."
        },
        "AC-6": {
            title: "Least Privilege",
            description: "The organization employs the principle of least privilege, allowing only authorized accesses for users.",
            guidance: "Regularly audit user permissions to ensure they are not broader than necessary."
        },
        "AC-20": {
            title: "Use of External Information Systems",
            description: "The organization establishes terms and conditions, consistent with any trust relationships established with other organizations owning external systems.",
            guidance: "Restrict the use of external systems (like personal devices or third-party apps) unless approved and secured."
        },
        "AT-1": {
            title: "Security Awareness and Training Policy",
            description: "The organization develops, documents, and disseminates a security awareness and training policy.",
            guidance: "Define who needs training, how often, and the consequences of non-compliance."
        },
        "AT-2": {
            title: "Security Awareness Training",
            description: "The organization provides basic security awareness training to information system users.",
            guidance: "Conduct phishing simulations and mandatory annual training modules."
        },
        "AU-3": {
            title: "Content of Audit Records",
            description: "The information system generates audit records containing information that establishes what type of event occurred, when, where, source, and outcome.",
            guidance: "Ensure logs capture timestamp, user ID, action type, and resource affected."
        },
        "CA-1": {
            title: "Security Assessment and Authorization Policy",
            description: "The organization develops, documents, and disseminates a security assessment and authorization policy.",
            guidance: "Establish a formal process for testing and authorizing new systems before deployment."
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
        },
        // ISO 27001
        "A.6.1.1": { title: "Information Security Roles and Responsibilities", description: "Responsibilities for information security shall be defined and allocated.", guidance: "Assign ownership of security risks and tasks." },
        "A.7.2.2": { title: "Information Security Awareness, Education and Training", description: "All employees shall receive appropriate awareness education and training.", guidance: "Regular training is key to compliance." },
        "A.8.2.1": { title: "Classification of Information", description: "Information shall be classified in terms of legal requirements, value, criticality and sensitivity to unauthorised disclosure or modification.", guidance: "Label documents as Public, Internal, Confidential." },
        "A.9.1.1": { title: "Access Control Policy", description: "An access control policy shall be established, documented and reviewed.", guidance: "Define who can access what." },
        "A.9.2.1": { title: "User Registration and De-registration", description: "A formal user registration and de-registration process shall be implemented to enable assignment of access rights.", guidance: "Automate onboarding and offboarding." },
        "A.12.6.1": { title: "Management of Technical Vulnerabilities", description: "Information about technical vulnerabilities of information systems being used shall be obtained in a timely fashion.", guidance: "Patch management is crucial." },
        "A.16.1.1": { title: "Reporting Information Security Events", description: "Information security events shall be reported through appropriate management channels as quickly as possible.", guidance: "Encourage 'See something, say something'." },
        "A.18.1.4": { title: "Privacy and Protection of Personally Identifiable Information", description: "Privacy and protection of PII shall be ensured as required in relevant legislation and regulation.", guidance: "GDPR compliance is built on this control." }
    };

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
    const totalArticles = regulation.articles.length;
    const mappedArticles = regulation.articles.filter(a => a.mappedControls).length;
    const coveragePercentage = Math.round((mappedArticles / totalArticles) * 100);
    const unmappedArticles = totalArticles - mappedArticles;

    const frameworkStats: Record<string, number> = {};
    regulation.articles.forEach(a => {
        const mappings = getNormalizedMappings(a.mappedControls);
        Object.keys(mappings).forEach(fw => {
            frameworkStats[fw] = (frameworkStats[fw] || 0) + 1;
        });
    });

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
                <Breadcrumb items={[
                    { label: "Compliance Obligations", href: `/clients/${clientId}/compliance-obligations` },
                    { label: regulation.name }
                ]} />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            {regulation.name}
                            <Badge variant="outline">{regulation.type}</Badge>
                        </h1>
                        <p className="text-muted-foreground">{regulation.description}</p>
                    </div>

                </div>

                <Tabs defaultValue="guide" className="h-full flex flex-col overflow-hidden">
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
                    </TabsList>

                    <TabsContent value="guide" className="flex-1 h-full overflow-hidden mt-4">
                        <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                            {/* Sidebar: Articles List */}
                            <Card className="w-full lg:w-96 flex flex-col h-full border-r-0 lg:border-r rounded-none lg:rounded-lg shadow-none lg:shadow-sm">
                                <CardHeader className="pb-3 border-b">
                                    <CardTitle className="text-lg">Articles</CardTitle>
                                </CardHeader>
                                <ScrollArea className="flex-1">
                                    <div className="p-3 space-y-1">
                                        {regulation.articles.map((article) => (
                                            <Button
                                                key={article.id}
                                                variant={activeArticleId === article.id ? "secondary" : "ghost"}
                                                className={cn(
                                                    "w-full justify-start text-left h-auto py-3 whitespace-normal",
                                                    activeArticleId === article.id ? "bg-secondary font-medium" : ""
                                                )}
                                                onClick={() => setActiveArticleId(article.id)}
                                            >
                                                <div className="flex items-start gap-3 w-full">
                                                    <Badge variant="outline" className="mt-0.5 shrink-0 w-10 h-6 flex items-center justify-center p-0 text-xs">{article.numericId}</Badge>
                                                    <span className="text-sm leading-snug">{article.title}</span>
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </Card>

                            {/* Main Content: Article Viewer */}
                            <div className="flex-1 h-full overflow-hidden flex flex-col">
                                {activeArticle ? (
                                    <Card className="h-full flex flex-col border-none shadow-md">
                                        <CardHeader className="border-b bg-muted/20 pb-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Badge>{regulation.name} Article {activeArticle.numericId}</Badge>
                                                {regulation.type && <Badge variant="outline">{regulation.type}</Badge>}
                                            </div>
                                            <CardTitle className="text-2xl">{activeArticle.title}</CardTitle>
                                        </CardHeader>
                                        <ScrollArea className="flex-1">
                                            <CardContent className="p-8 max-w-4xl mx-auto">
                                                <div className="prose prose-slate dark:prose-invert max-w-none">
                                                    <p className="text-lg leading-relaxed">{activeArticle.description}</p>

                                                    {activeArticle.subArticles && activeArticle.subArticles.length > 0 && (
                                                        <div className="mt-8 space-y-6">
                                                            <h3 className="text-xl font-semibold">Sub-Articles</h3>
                                                            <div className="grid gap-4">
                                                                {activeArticle.subArticles.map(sub => (
                                                                    <div key={sub.id} className="p-4 rounded-lg border bg-card/50">
                                                                        <h4 className="font-medium mb-2">{sub.title}</h4>
                                                                        <p className="text-sm text-muted-foreground">{sub.description}</p>
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
                                                                                    onClick={() => setLocation(`/clients/${clientId}/intake`)}
                                                                                >
                                                                                    <Paperclip className="h-3 w-3 text-orange-500" />
                                                                                    <span className="truncate flex-1 group-hover:text-orange-600 transition-colors font-medium">{e.name}</span>
                                                                                    <span className="text-xs text-muted-foreground">({e.fileType})</span>
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
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        Select an article to view details
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
                                                Displaying {regulation.articles.filter(a => a.mappedControls).length} of {regulation.articles.length} Articles
                                            </p>
                                            <p className="text-sm opacity-90">
                                                This view filters to only show articles that have specific control mappings defined (NIST 800-53, ISO 27001, etc).
                                                Articles without direct control mappings (such as definitions or purely administrative clauses) are hidden from this view.
                                            </p>
                                        </div>
                                    </div>

                                    {regulation.articles.filter(a => a.mappedControls).length > 0 ? (
                                        regulation.articles.filter(a => a.mappedControls).map(article => (
                                            <div key={article.id} className="flex flex-col border-b pb-4 last:border-0 last:pb-0 gap-3">
                                                <div>
                                                    <h4 className="font-semibold text-sm">Article {article.numericId}: {article.title}</h4>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {Object.entries(getNormalizedMappings(article.mappedControls)).map(([framework, controls]) => (
                                                        <div key={framework} className="flex items-center gap-3 text-sm">
                                                            <span className="w-24 shrink-0 text-muted-foreground text-xs font-semibold">{framework}</span>
                                                            <div className="flex gap-2 flex-wrap">
                                                                {controls.map(c => (
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
                                            {regulation.articles.filter(a => !a.mappedControls).slice(0, 10).map(a => (
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
                        {regulation.articles.filter(a => !a.mappedControls).map(a => (
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
                                            <Sparkles className="h-3 w-3 text-purple-500" /> AI Suggested Controls
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

