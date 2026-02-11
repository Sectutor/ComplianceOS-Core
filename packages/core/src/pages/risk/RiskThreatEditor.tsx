import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@complianceos/ui/ui/button';
import { Label } from '@complianceos/ui/ui/label';
import { Input } from '@complianceos/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@complianceos/ui/ui/select';
import { Textarea } from '@complianceos/ui/ui/textarea';
import { trpc } from '@/lib/trpc';
import { AlertTriangle, Loader2, Save, ArrowLeft, Calendar, Shield, Target, Zap, FileText, Library, ExternalLink, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@complianceos/ui/ui/card';
import DashboardLayout from '@/components/DashboardLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Popover, PopoverContent, PopoverTrigger } from '@complianceos/ui/ui/popover';
import { Badge } from '@complianceos/ui/ui/badge';
import { PageGuide } from '@/components/PageGuide';

// Comprehensive threat templates from ENISA, NIST, and ISO 27005
// Comprehensive threat templates from ENISA, NIST, and ISO 27005
const COMMON_THREATS = [
    // === TECHNICAL / CYBER THREATS ===
    {
        name: 'Ransomware Attack', category: 'Technical', source: 'External', intent: 'Deliberate', likelihood: 'Likely',
        description: 'Malicious software that encrypts data and demands payment for decryption keys.',
        potentialImpact: 'Business disruption, data loss, financial damage, reputational harm',
        mitreId: 'T1486', mitreTactic: 'Impact'
    },
    {
        name: 'Phishing / Spear Phishing', category: 'Human', source: 'External', intent: 'Deliberate', likelihood: 'Almost Certain',
        description: 'Deceptive emails designed to steal credentials or install malware.',
        potentialImpact: 'Credential theft, unauthorized access, malware infection',
        mitreId: 'T1566', mitreTactic: 'Initial Access'
    },
    {
        name: 'Business Email Compromise (BEC)', category: 'Human', source: 'External', intent: 'Deliberate', likelihood: 'Likely',
        description: 'Fraudulent emails impersonating executives to authorize wire transfers.',
        potentialImpact: 'Financial loss, wire fraud, reputational damage',
        mitreId: 'T1598', mitreTactic: 'Reconnaissance'
    },
    {
        name: 'Denial of Service (DDoS)', category: 'Technical', source: 'External', intent: 'Deliberate', likelihood: 'Likely',
        description: 'Overwhelming systems with traffic to make services unavailable.',
        potentialImpact: 'Service outage, revenue loss, customer dissatisfaction',
        mitreId: 'T1498', mitreTactic: 'Impact'
    },
    {
        name: 'Zero-Day Exploitation', category: 'Technical', source: 'Hacker', intent: 'Deliberate', likelihood: 'Possible',
        description: 'Exploitation of unknown vulnerabilities before patches exist.',
        potentialImpact: 'Full system compromise, data breach, persistent access',
        mitreId: 'T1211', mitreTactic: 'Exploitation'
    },
    {
        name: 'Advanced Persistent Threat (APT)', category: 'Technical', source: 'External', intent: 'Deliberate', likelihood: 'Possible',
        description: 'Prolonged targeted attacks by nation-states or organized groups.',
        potentialImpact: 'Intellectual property theft, espionage, long-term compromise'
    },
    {
        name: 'SQL Injection', category: 'Technical', source: 'External', intent: 'Deliberate', likelihood: 'Likely',
        description: 'Injection of malicious SQL code to access or modify databases.',
        potentialImpact: 'Data breach, data manipulation, unauthorized access',
        mitreId: 'T1190', mitreTactic: 'Initial Access'
    },
    {
        name: 'Cross-Site Scripting (XSS)', category: 'Technical', source: 'External', intent: 'Deliberate', likelihood: 'Likely',
        description: 'Injecting scripts into web pages viewed by other users.',
        potentialImpact: 'Session hijacking, credential theft, defacement',
        mitreId: 'T1190', mitreTactic: 'Initial Access'
    },
    {
        name: 'Man-in-the-Middle Attack', category: 'Technical', source: 'External', intent: 'Deliberate', likelihood: 'Possible',
        description: 'Intercepting communications between two parties.',
        potentialImpact: 'Data interception, credential theft, session hijacking',
        mitreId: 'T1557', mitreTactic: 'Credential Access'
    },
    {
        name: 'Credential Stuffing', category: 'Technical', source: 'External', intent: 'Deliberate', likelihood: 'Almost Certain',
        description: 'Using leaked credentials to gain unauthorized access.',
        potentialImpact: 'Account takeover, unauthorized access, data breach',
        mitreId: 'T1110', mitreTactic: 'Credential Access'
    },
    {
        name: 'Cryptojacking', category: 'Technical', source: 'External', intent: 'Deliberate', likelihood: 'Possible',
        description: 'Unauthorized use of computing resources to mine cryptocurrency.',
        potentialImpact: 'Performance degradation, increased costs, resource abuse',
        mitreId: 'T1496', mitreTactic: 'Impact'
    },

    // === SUPPLY CHAIN & THIRD PARTY ===
    {
        name: 'Supply Chain Compromise', category: 'Technical', source: 'External', intent: 'Deliberate', likelihood: 'Possible',
        description: 'Attacks targeting software/hardware supply chain.',
        potentialImpact: 'Widespread compromise, third-party risk, hard to detect',
        mitreId: 'T1195', mitreTactic: 'Initial Access'
    },
    {
        name: 'Third-Party Data Breach', category: 'Technical', source: 'External', intent: 'Deliberate', likelihood: 'Likely',
        description: 'Data exposure through compromised vendor or partner.',
        potentialImpact: 'Data breach, regulatory penalties, reputational damage'
    },
    {
        name: 'Cloud Service Failure', category: 'Technical', source: 'External', intent: 'Accidental', likelihood: 'Possible',
        description: 'Outage or security incident at cloud provider.',
        potentialImpact: 'Service disruption, data unavailability, SLA breach'
    },

    // === INSIDER THREATS ===
    {
        name: 'Insider Threat - Data Theft', category: 'Human', source: 'Insider', intent: 'Deliberate', likelihood: 'Possible',
        description: 'Intentional data exfiltration by employees or contractors.',
        potentialImpact: 'Data breach, IP theft, competitive disadvantage',
        mitreId: 'T1048', mitreTactic: 'Exfiltration'
    },
    {
        name: 'Insider Threat - Sabotage', category: 'Human', source: 'Insider', intent: 'Deliberate', likelihood: 'Unlikely',
        description: 'Disgruntled employees intentionally damaging systems.',
        potentialImpact: 'System damage, data destruction, operational disruption'
    },
    {
        name: 'Privilege Misuse', category: 'Human', source: 'Internal', intent: 'Deliberate', likelihood: 'Possible',
        description: 'Abuse of legitimate access rights for unauthorized purposes.',
        potentialImpact: 'Unauthorized access, data theft, fraud'
    },

    // === HUMAN ERROR ===
    {
        name: 'Accidental Data Exposure', category: 'Human', source: 'Internal', intent: 'Accidental', likelihood: 'Likely',
        description: 'Unintentional disclosure via misconfiguration or email errors.',
        potentialImpact: 'Data breach, regulatory fines, reputational damage'
    },
    {
        name: 'Misconfiguration', category: 'Human', source: 'Internal', intent: 'Accidental', likelihood: 'Likely',
        description: 'Improper system or security configuration.',
        potentialImpact: 'Unauthorized access, data exposure, security gaps'
    },
    {
        name: 'Lost/Stolen Device', category: 'Human', source: 'Internal', intent: 'Accidental', likelihood: 'Likely',
        description: 'Loss or theft of laptops, phones, or storage devices.',
        potentialImpact: 'Data breach, unauthorized access, compliance violation'
    },
    {
        name: 'Improper Data Disposal', category: 'Human', source: 'Internal', intent: 'Accidental', likelihood: 'Possible',
        description: 'Failure to properly destroy sensitive data or media.',
        potentialImpact: 'Data recovery by adversaries, compliance violation'
    },

    // === PHYSICAL & ENVIRONMENTAL ===
    {
        name: 'Natural Disaster', category: 'Natural', source: 'Nature', intent: 'Accidental', likelihood: 'Unlikely',
        description: 'Earthquakes, floods, hurricanes, or fires damaging infrastructure.',
        potentialImpact: 'Physical damage, business continuity impact, data center outage'
    },
    {
        name: 'Power Outage', category: 'Environmental', source: 'External', intent: 'Accidental', likelihood: 'Possible',
        description: 'Loss of electrical power affecting operations.',
        potentialImpact: 'Service disruption, data corruption, equipment damage'
    },
    {
        name: 'Physical Intrusion', category: 'Human', source: 'External', intent: 'Deliberate', likelihood: 'Unlikely',
        description: 'Unauthorized physical access to facilities or assets.',
        potentialImpact: 'Theft, hardware tampering, data exfiltration'
    },
    {
        name: 'Hardware Failure', category: 'Technical', source: 'Internal', intent: 'Accidental', likelihood: 'Possible',
        description: 'Failure of servers, storage, or network equipment.',
        potentialImpact: 'Service disruption, data loss, recovery costs'
    },

    // === REGULATORY & COMPLIANCE ===
    {
        name: 'Regulatory Non-Compliance', category: 'Human', source: 'Internal', intent: 'Accidental', likelihood: 'Possible',
        description: 'Failure to meet GDPR, HIPAA, or other regulatory requirements.',
        potentialImpact: 'Fines, legal action, operational restrictions'
    },
    {
        name: 'Privacy Violation', category: 'Human', source: 'Internal', intent: 'Accidental', likelihood: 'Possible',
        description: 'Unauthorized collection, use, or disclosure of personal data.',
        potentialImpact: 'Regulatory fines, lawsuits, reputational harm'
    },
];
export default function RiskThreatEditor() {
    const [location, setLocation] = useLocation();
    const [_, params] = useRoute('/clients/:clientId/risks/threats/:threatId');
    const clientId = params?.clientId ? parseInt(params.clientId) : 0;
    const threatIdParam = params?.threatId;
    const isNew = threatIdParam === 'new';
    const dbId = !isNew && threatIdParam ? parseInt(threatIdParam) : null;

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('identification');
    const [templateSearch, setTemplateSearch] = useState('');
    const [templateCategory, setTemplateCategory] = useState('All');

    // Filter templates based on search and category
    const filteredTemplates = React.useMemo(() => {
        return COMMON_THREATS.filter(t => {
            const matchesSearch = !templateSearch ||
                t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                t.description.toLowerCase().includes(templateSearch.toLowerCase());
            const matchesCategory = templateCategory === 'All' || t.category === templateCategory;
            return matchesSearch && matchesCategory;
        });
    }, [templateSearch, templateCategory]);

    const [formData, setFormData] = useState({
        threatId: `THREAT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
        name: '',
        description: '',
        category: 'Technical',
        source: 'External',
        intent: 'Deliberate',
        likelihood: 'Possible',
        potentialImpact: '',
        affectedAssets: '',
        relatedVulnerabilities: '',
        associatedRisks: '',
        scenario: '',
        detectionMethod: '',
        status: 'active',
        owner: '',
        lastReviewDate: '',
    });

    // Queries
    const { data: client } = trpc.clients.get.useQuery({ id: clientId }, { enabled: !!clientId });
    const { data: users } = trpc.clients.getUsers.useQuery({ clientId }, { enabled: !!clientId });

    // Fetch existing threat if editing
    const { data: threats, isLoading: isLoadingThreat } = trpc.risks.getThreats.useQuery(
        { clientId },
        { enabled: !!dbId && !!clientId }
    );

    const existingThreat = threats?.find(t => t.id === dbId);

    // Initial Data Load
    useEffect(() => {
        if (existingThreat) {
            setFormData({
                threatId: existingThreat.threatId || '',
                name: existingThreat.name || '',
                description: existingThreat.description || '',
                category: existingThreat.category || 'Technical',
                source: existingThreat.source || 'External',
                intent: existingThreat.intent || 'Deliberate',
                likelihood: existingThreat.likelihood || 'Possible',
                potentialImpact: existingThreat.potentialImpact || '',
                affectedAssets: Array.isArray(existingThreat.affectedAssets)
                    ? existingThreat.affectedAssets.join(', ')
                    : (existingThreat.affectedAssets || ''),
                relatedVulnerabilities: Array.isArray(existingThreat.relatedVulnerabilities)
                    ? existingThreat.relatedVulnerabilities.join(', ')
                    : (existingThreat.relatedVulnerabilities || ''),
                associatedRisks: Array.isArray(existingThreat.associatedRisks)
                    ? existingThreat.associatedRisks.join(', ')
                    : (existingThreat.associatedRisks || ''),
                scenario: existingThreat.scenario || '',
                detectionMethod: existingThreat.detectionMethod || '',
                status: existingThreat.status || 'active',
                owner: existingThreat.owner || '',
                lastReviewDate: existingThreat.lastReviewDate ? new Date(existingThreat.lastReviewDate).toISOString().split('T')[0] : '',
            });
        }
    }, [existingThreat]);

    // Mutations
    const createMutation = trpc.risks.createThreat.useMutation({
        onSuccess: () => {
            toast.success('Threat recorded successfully');
            setLocation(`/clients/${clientId}/risks/threats`);
        },
        onError: (err) => toast.error(`Failed to record: ${err.message}`)
    });

    const updateMutation = trpc.risks.updateThreat.useMutation({
        onSuccess: () => {
            toast.success('Threat updated successfully');
            setLocation(`/clients/${clientId}/risks/threats`);
        },
        onError: (err) => toast.error(`Failed to update: ${err.message}`)
    });

    // Import from template
    // Import from template
    const handleImportTemplate = (template: typeof COMMON_THREATS[0]) => {
        const mitreInfo = (template as any).mitreId
            ? `\n\nMITRE ATT&CK: ${(template as any).mitreId} (${(template as any).mitreTactic})`
            : '';

        setFormData(prev => ({
            ...prev,
            name: template.name,
            description: template.description + mitreInfo,
            category: template.category,
            source: template.source,
            intent: template.intent,
            likelihood: template.likelihood,
            potentialImpact: template.potentialImpact,
        }));
        toast.success(`Imported "${template.name}" template`);
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            toast.error("Threat name is required");
            return;
        }

        setLoading(true);
        try {
            const commonData = {
                name: formData.name,
                description: formData.description,
                category: formData.category,
                source: formData.source,
                intent: formData.intent,
                likelihood: formData.likelihood,
                potentialImpact: formData.potentialImpact,
                affectedAssets: formData.affectedAssets ? formData.affectedAssets.split(',').map(s => s.trim()) : [],
                relatedVulnerabilities: formData.relatedVulnerabilities ? formData.relatedVulnerabilities.split(',').map(s => s.trim()) : [],
                associatedRisks: formData.associatedRisks ? formData.associatedRisks.split(',').map(s => s.trim()) : [],
                scenario: formData.scenario,
                detectionMethod: formData.detectionMethod,
                status: formData.status as any,
                owner: formData.owner,
                lastReviewDate: formData.lastReviewDate || undefined,
            };

            if (dbId) {
                await updateMutation.mutateAsync({
                    id: dbId,
                    ...commonData,
                });
            } else {
                await createMutation.mutateAsync({
                    clientId,
                    threatId: formData.threatId,
                    ...commonData,
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (isLoadingThreat && !isNew) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <DashboardLayout>
            <div className="w-full px-6 py-8 pb-20">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Breadcrumb
                        items={[
                            { label: "Clients", href: "/clients" },
                            { label: client?.name || "Client", href: `/clients/${clientId}` },
                            { label: "Threat Library", href: `/clients/${clientId}/risks/threats` },
                            { label: isNew ? "Record Threat" : formData.threatId },
                        ]}
                    />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setLocation(`/clients/${clientId}/risks/threats`)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6 text-[#1C4D8D]" />
                                {isNew ? 'Record Threat' : 'Edit Threat'}
                            </h1>
                            <p className="text-muted-foreground">{formData.threatId}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Library className="w-4 h-4" />
                                    Import Template
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 p-0" align="end">
                                <div className="p-3 border-b space-y-2">
                                    <p className="text-sm font-medium">Common Threat Templates</p>
                                    <Input
                                        placeholder="Search threats..."
                                        value={templateSearch}
                                        onChange={e => setTemplateSearch(e.target.value)}
                                        className="h-8"
                                    />
                                    <div className="flex gap-1 flex-wrap">
                                        {['All', 'Technical', 'Human', 'Natural', 'Environmental'].map(cat => (
                                            <Button
                                                key={cat}
                                                variant={templateCategory === cat ? 'default' : 'outline'}
                                                size="sm"
                                                className="h-6 text-xs px-2"
                                                onClick={() => setTemplateCategory(cat)}
                                            >
                                                {cat}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {filteredTemplates.length === 0 ? (
                                        <div className="text-center py-4 text-muted-foreground text-sm">
                                            No threats match your search
                                        </div>
                                    ) : (
                                        filteredTemplates.map((template, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleImportTemplate(template)}
                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 border-b last:border-0"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">{template.name}</span>
                                                    <Badge variant="outline" className="text-xs">{template.category}</Badge>
                                                    {(template as any).mitreId && (
                                                        <Badge variant="secondary" className="text-xs font-mono bg-blue-50 text-[#1C4D8D] dark:bg-blue-900/30 dark:text-blue-300">
                                                            {(template as any).mitreId}
                                                        </Badge>
                                                    )}
                                                    {template.likelihood === 'Almost Certain' && (
                                                        <Badge variant="destructive" className="text-xs">High Risk</Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                    {template.description}
                                                </p>
                                            </button>
                                        ))
                                    )}
                                </div>
                                <div className="p-2 border-t text-xs text-muted-foreground text-center">
                                    {filteredTemplates.length} of {COMMON_THREATS.length} templates
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Button variant="outline" onClick={() => setLocation(`/clients/${clientId}/risks/threats`)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading} className="bg-[#1C4D8D] hover:bg-[#1C4D8D]/90">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <Save className="w-4 h-4 mr-2" />
                            {isNew ? 'Record Threat' : 'Save Changes'}
                        </Button>
                        <PageGuide
                            title={isNew ? "Record New Threat" : "Edit Threat"}
                            description="Define a threat scenario, its origin, and potential impact."
                            rationale="Detailed threat definitions help risk owners understand 'what could go wrong' and prioritize controls effectively."
                            howToUse={[
                                { step: "Import Template", description: "Use 'Import Template' to auto-fill common scenarios like 'Phishing' or 'Ransomware'." },
                                { step: "Classify", description: "Set the Category, Source, and Intent to filter threats in reports." },
                                { step: "Estimate Impact", description: "Describe the 'worst-case scenario' if this threat materializes." }
                            ]}
                            integrations={[
                                { name: "MITRE ATT&CK", description: "Templates are pre-mapped to MITRE tactics (e.g., Initial Access)." },
                                { name: "Vulnerabilities", description: "Link known vulnerabilities (CVEs) that this threat exploits." }
                            ]}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-1 space-y-1">
                        <nav className="flex flex-col space-y-1 sticky top-8">
                            {[
                                { id: 'identification', label: 'Identification', icon: FileText, desc: 'Basic Details' },
                                { id: 'classification', label: 'Classification', icon: Target, desc: 'Source & Intent' },
                                { id: 'impact', label: 'Impact & Scenario', icon: Zap, desc: 'Consequences' },
                                { id: 'management', label: 'Management', icon: Shield, desc: 'Ownership' },
                            ].map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveTab(section.id)}
                                    className={`group flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === section.id
                                        ? 'bg-[#1C4D8D] text-white shadow-md ring-1 ring-[#1C4D8D]'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-transparent'
                                        }`}
                                >
                                    <div className={`p-2 rounded-md transition-colors ${activeTab === section.id
                                        ? 'bg-white/20'
                                        : 'bg-slate-100 group-hover:bg-white border border-slate-200 group-hover:border-slate-300'
                                        }`}
                                    >
                                        <section.icon className={`w-4 h-4 ${activeTab === section.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
                                    </div>
                                    <div>
                                        <span className="block">{section.label}</span>
                                        <span className={`text-[10px] font-normal ${activeTab === section.id ? 'text-blue-100' : 'text-slate-400 group-hover:text-slate-500'}`}>
                                            {section.desc}
                                        </span>
                                    </div>
                                    {activeTab === section.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Main Content Form */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Identification Section */}
                        <div className={activeTab === 'identification' ? 'block' : 'hidden'}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Threat Identification</CardTitle>
                                    <CardDescription>Basic information about the threat.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Threat Name *</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Ransomware Attack, Insider Data Theft"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Threat ID</Label>
                                            <Input
                                                value={formData.threatId}
                                                disabled={!isNew}
                                                onChange={e => setFormData({ ...formData, threatId: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Category</Label>
                                            <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Natural">Natural</SelectItem>
                                                    <SelectItem value="Human">Human</SelectItem>
                                                    <SelectItem value="Environmental">Environmental</SelectItem>
                                                    <SelectItem value="Technical">Technical</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Detailed description of the threat..."
                                            className="min-h-[120px]"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Classification Section */}
                        <div className={activeTab === 'classification' ? 'block' : 'hidden'}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Threat Classification</CardTitle>
                                    <CardDescription>Categorize the source, intent, and likelihood of the threat.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label>Source / Actor</Label>
                                            <Select value={formData.source} onValueChange={v => setFormData({ ...formData, source: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Internal">Internal</SelectItem>
                                                    <SelectItem value="External">External</SelectItem>
                                                    <SelectItem value="Hacker">Hacker</SelectItem>
                                                    <SelectItem value="Insider">Insider</SelectItem>
                                                    <SelectItem value="Nature">Nature</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Intent</Label>
                                            <Select value={formData.intent} onValueChange={v => setFormData({ ...formData, intent: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Accidental">Accidental</SelectItem>
                                                    <SelectItem value="Deliberate">Deliberate</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Likelihood</Label>
                                            <Select value={formData.likelihood} onValueChange={v => setFormData({ ...formData, likelihood: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Rare">Rare</SelectItem>
                                                    <SelectItem value="Unlikely">Unlikely</SelectItem>
                                                    <SelectItem value="Possible">Possible</SelectItem>
                                                    <SelectItem value="Likely">Likely</SelectItem>
                                                    <SelectItem value="Almost Certain">Almost Certain</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Detection Method</Label>
                                        <Input
                                            value={formData.detectionMethod}
                                            onChange={e => setFormData({ ...formData, detectionMethod: e.target.value })}
                                            placeholder="e.g. SIEM alerts, user reports, log analysis"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Impact & Scenario Section */}
                        <div className={activeTab === 'impact' ? 'block' : 'hidden'}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Impact & Scenario</CardTitle>
                                    <CardDescription>Describe the potential impact and how the threat might manifest.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Threat Scenario / Example</Label>
                                        <Textarea
                                            value={formData.scenario}
                                            onChange={e => setFormData({ ...formData, scenario: e.target.value })}
                                            placeholder="Describe how this threat might manifest in your environment..."
                                            className="min-h-[120px]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Potential Business Impact</Label>
                                        <Input
                                            value={formData.potentialImpact}
                                            onChange={e => setFormData({ ...formData, potentialImpact: e.target.value })}
                                            placeholder="e.g. Data breach, operational downtime, reputational damage"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Affected Assets (comma separated)</Label>
                                        <Input
                                            value={formData.affectedAssets}
                                            onChange={e => setFormData({ ...formData, affectedAssets: e.target.value })}
                                            placeholder="e.g. Customer DB, Payment Gateway, Email Server"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Related Vulnerabilities (comma separated)</Label>
                                        <Input
                                            value={formData.relatedVulnerabilities}
                                            onChange={e => setFormData({ ...formData, relatedVulnerabilities: e.target.value })}
                                            placeholder="e.g. VULN-2024-001, VULN-2024-002"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Management Section */}
                        <div className={activeTab === 'management' ? 'block' : 'hidden'}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Threat Management</CardTitle>
                                    <CardDescription>Track ownership and review status.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="dormant">Dormant</SelectItem>
                                                    <SelectItem value="monitored">Monitored</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Threat Owner</Label>
                                            <Select value={formData.owner} onValueChange={v => setFormData({ ...formData, owner: v })}>
                                                <SelectTrigger><SelectValue placeholder="Select Owner" /></SelectTrigger>
                                                <SelectContent>
                                                    {users?.map(u => (
                                                        <SelectItem key={u.id} value={u.name || u.email}>
                                                            {u.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Last Review Date</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                                <Input
                                                    type="date"
                                                    className="pl-9"
                                                    value={formData.lastReviewDate}
                                                    onChange={e => setFormData({ ...formData, lastReviewDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
