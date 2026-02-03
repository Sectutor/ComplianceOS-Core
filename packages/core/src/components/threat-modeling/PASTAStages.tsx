import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea, Button, Badge, Checkbox } from '@complianceos/ui';
import { Target, Layers, GitBranch, Shield, Bug, Swords, TrendingUp, ChevronRight, ChevronDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * PASTA (Process for Attack Simulation and Threat Analysis) - 7 Stage Methodology
 * Risk-centric threat modeling approach
 */

export interface PASTAData {
    // Stage I: Definition of Objectives
    businessObjectives: string[];
    securityObjectives: string[];
    complianceRequirements: string[];

    // Stage II: Technical Scope
    technicalScope: {
        applications: string[];
        infrastructureComponents: string[];
        dataAssets: string[];
        externalDependencies: string[];
    };

    // Stage III: Application Decomposition
    decomposition: {
        dataFlows: any[];  // From existing threat model
        trustBoundaries: string[];
        entryExitPoints: string[];
    };

    // Stage IV: Threat Analysis
    threatAnalysis: {
        threatActors: Array<{
            name: string;
            motivation: string;
            capability: string;
        }>;
        threatScenarios: string[];
    };

    // Stage V: Vulnerability & Weakness Analysis
    vulnerabilities: Array<{
        id: string;
        description: string;
        cwe?: string;
        cvss?: number;
    }>;

    // Stage VI: Attack Modeling
    attackTrees: Array<{
        goal: string;
        attackPaths: string[];
        prerequisites: string[];
    }>;

    // Stage VII: Risk & Impact Analysis
    riskAnalysis: Array<{
        threat: string;
        likelihood: number;
        impact: number;
        businessImpact: string;
        mitigation: string;
    }>;
}

interface PASTAStagesProps {
    onComplete: (data: PASTAData) => void;
    initialData?: Partial<PASTAData>;
    components?: any[];  // Threat model components
}

const THREAT_ACTOR_TEMPLATES = [
    { name: 'External Hacker', motivation: 'Financial gain, Data theft', capability: 'High' },
    { name: 'Insider Threat', motivation: 'Revenge, Financial gain', capability: 'Medium-High' },
    { name: 'Nation State', motivation: 'Espionage, Disruption', capability: 'Very High' },
    { name: 'Competitor', motivation: 'Competitive advantage', capability: 'Medium' },
    { name: 'Script Kiddie', motivation: 'Notoriety', capability: 'Low' },
];

export function PASTAStages({ onComplete, initialData, components }: PASTAStagesProps) {
    const [currentStage, setCurrentStage] = useState(1);
    const [expandedStage, setExpandedStage] = useState<number | null>(1);
    const [data, setData] = useState<PASTAData>({
        businessObjectives: initialData?.businessObjectives || [],
        securityObjectives: initialData?.securityObjectives || [],
        complianceRequirements: initialData?.complianceRequirements || [],
        technicalScope: initialData?.technicalScope || {
            applications: [],
            infrastructureComponents: [],
            dataAssets: [],
            externalDependencies: [],
        },
        decomposition: initialData?.decomposition || {
            dataFlows: [],
            trustBoundaries: [],
            entryExitPoints: [],
        },
        threatAnalysis: initialData?.threatAnalysis || {
            threatActors: [],
            threatScenarios: [],
        },
        vulnerabilities: initialData?.vulnerabilities || [],
        attackTrees: initialData?.attackTrees || [],
        riskAnalysis: initialData?.riskAnalysis || [],
    });

    // Temporary input states
    const [newObjective, setNewObjective] = useState('');
    const [newSecObjective, setNewSecObjective] = useState('');
    const [newCompliance, setNewCompliance] = useState('');
    const [newApp, setNewApp] = useState('');
    const [newInfra, setNewInfra] = useState('');
    const [newDataAsset, setNewDataAsset] = useState('');
    const [newDependency, setNewDependency] = useState('');
    const [newBoundary, setNewBoundary] = useState('');
    const [newEntryPoint, setNewEntryPoint] = useState('');
    const [newThreatScenario, setNewThreatScenario] = useState('');

    const stages = [
        { id: 1, title: 'Business Objectives', icon: Target, description: 'Define business and security goals' },
        { id: 2, title: 'Technical Scope', icon: Layers, description: 'Identify technical boundaries' },
        { id: 3, title: 'Decomposition', icon: GitBranch, description: 'Analyze application structure' },
        { id: 4, title: 'Threat Analysis', icon: Shield, description: 'Identify threat actors & scenarios' },
        { id: 5, title: 'Vulnerabilities', icon: Bug, description: 'Analyze weaknesses' },
        { id: 6, title: 'Attack Modeling', icon: Swords, description: 'Model attack paths' },
        { id: 7, title: 'Risk & Impact', icon: TrendingUp, description: 'Assess and prioritize risks' },
    ];

    const isStageComplete = (stageId: number): boolean => {
        switch (stageId) {
            case 1:
                return data.businessObjectives.length > 0 && data.securityObjectives.length > 0;
            case 2:
                return data.technicalScope.applications.length > 0;
            case 3:
                return data.decomposition.trustBoundaries.length > 0 || data.decomposition.entryExitPoints.length > 0;
            case 4:
                return data.threatAnalysis.threatActors.length > 0;
            case 5:
                return data.vulnerabilities.length > 0;
            case 6:
                return data.attackTrees.length > 0;
            case 7:
                return data.riskAnalysis.length > 0;
            default:
                return false;
        }
    };

    const addBusinessObjective = () => {
        if (newObjective.trim()) {
            setData({ ...data, businessObjectives: [...data.businessObjectives, newObjective.trim()] });
            setNewObjective('');
        }
    };

    const addSecurityObjective = () => {
        if (newSecObjective.trim()) {
            setData({ ...data, securityObjectives: [...data.securityObjectives, newSecObjective.trim()] });
            setNewSecObjective('');
        }
    };

    const addCompliance = () => {
        if (newCompliance.trim()) {
            setData({ ...data, complianceRequirements: [...data.complianceRequirements, newCompliance.trim()] });
            setNewCompliance('');
        }
    };

    const addThreatActor = (template: typeof THREAT_ACTOR_TEMPLATES[0]) => {
        setData({
            ...data,
            threatAnalysis: {
                ...data.threatAnalysis,
                threatActors: [...data.threatAnalysis.threatActors, template],
            },
        });
    };

    return (
        <div className="space-y-4">
            {/* Progress Bar */}
            <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">PASTA Progress</h3>
                    <span className="text-xs text-muted-foreground">
                        {stages.filter(s => isStageComplete(s.id)).length} / {stages.length} Complete
                    </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                        style={{ width: `${(stages.filter(s => isStageComplete(s.id)).length / stages.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Stages */}
            {stages.map((stage) => {
                const Icon = stage.icon;
                const isComplete = isStageComplete(stage.id);
                const isExpanded = expandedStage === stage.id;

                return (
                    <Card key={stage.id} className={cn("border-2 transition-all", isComplete ? "border-green-200 bg-green-50/30" : "border-gray-200")}>
                        <CardHeader
                            className="cursor-pointer hover:bg-gray-50/50 transition-colors"
                            onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg", isComplete ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600")}>
                                        {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">Stage {stage.id}: {stage.title}</CardTitle>
                                        <CardDescription className="text-xs">{stage.description}</CardDescription>
                                    </div>
                                </div>
                                {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </div>
                        </CardHeader>

                        {isExpanded && (
                            <CardContent className="pt-0">
                                {/* Stage 1: Business Objectives */}
                                {stage.id === 1 && (
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Business Objectives</Label>
                                            <div className="flex gap-2 mb-2">
                                                <Input
                                                    placeholder="e.g., Ensure 99.9% uptime for customer portal"
                                                    value={newObjective}
                                                    onChange={(e) => setNewObjective(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && addBusinessObjective()}
                                                />
                                                <Button onClick={addBusinessObjective} size="sm">Add</Button>
                                            </div>
                                            <div className="space-y-1">
                                                {data.businessObjectives.map((obj, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 rounded text-sm">
                                                        <span>{obj}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setData({ ...data, businessObjectives: data.businessObjectives.filter((_, i) => i !== idx) })}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Security Objectives</Label>
                                            <div className="flex gap-2 mb-2">
                                                <Input
                                                    placeholder="e.g., Protect customer PII from unauthorized access"
                                                    value={newSecObjective}
                                                    onChange={(e) => setNewSecObjective(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && addSecurityObjective()}
                                                />
                                                <Button onClick={addSecurityObjective} size="sm">Add</Button>
                                            </div>
                                            <div className="space-y-1">
                                                {data.securityObjectives.map((obj, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2 bg-green-50 rounded text-sm">
                                                        <span>{obj}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setData({ ...data, securityObjectives: data.securityObjectives.filter((_, i) => i !== idx) })}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Compliance Requirements</Label>
                                            <div className="flex gap-2 mb-2">
                                                <Input
                                                    placeholder="e.g., GDPR Article 32 - Security of Processing"
                                                    value={newCompliance}
                                                    onChange={(e) => setNewCompliance(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && addCompliance()}
                                                />
                                                <Button onClick={addCompliance} size="sm">Add</Button>
                                            </div>
                                            <div className="space-y-1">
                                                {data.complianceRequirements.map((req, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2 bg-purple-50 rounded text-sm">
                                                        <span>{req}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setData({ ...data, complianceRequirements: data.complianceRequirements.filter((_, i) => i !== idx) })}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Stage 2: Technical Scope */}
                                {stage.id === 2 && (
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Applications in Scope</Label>
                                            <div className="flex gap-2 mb-2">
                                                <Input
                                                    placeholder="e.g., Customer Portal Web App"
                                                    value={newApp}
                                                    onChange={(e) => setNewApp(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter' && newApp.trim()) {
                                                            setData({
                                                                ...data,
                                                                technicalScope: {
                                                                    ...data.technicalScope,
                                                                    applications: [...data.technicalScope.applications, newApp.trim()],
                                                                },
                                                            });
                                                            setNewApp('');
                                                        }
                                                    }}
                                                />
                                                <Button onClick={() => {
                                                    if (newApp.trim()) {
                                                        setData({
                                                            ...data,
                                                            technicalScope: {
                                                                ...data.technicalScope,
                                                                applications: [...data.technicalScope.applications, newApp.trim()],
                                                            },
                                                        });
                                                        setNewApp('');
                                                    }
                                                }} size="sm">Add</Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {data.technicalScope.applications.map((app, idx) => (
                                                    <Badge key={idx} variant="secondary" className="gap-1">
                                                        {app}
                                                        <button onClick={() => {
                                                            setData({
                                                                ...data,
                                                                technicalScope: {
                                                                    ...data.technicalScope,
                                                                    applications: data.technicalScope.applications.filter((_, i) => i !== idx),
                                                                },
                                                            });
                                                        }}>×</button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Infrastructure Components</Label>
                                            <div className="flex gap-2 mb-2">
                                                <Input
                                                    placeholder="e.g., AWS EC2, PostgreSQL Database"
                                                    value={newInfra}
                                                    onChange={(e) => setNewInfra(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter' && newInfra.trim()) {
                                                            setData({
                                                                ...data,
                                                                technicalScope: {
                                                                    ...data.technicalScope,
                                                                    infrastructureComponents: [...data.technicalScope.infrastructureComponents, newInfra.trim()],
                                                                },
                                                            });
                                                            setNewInfra('');
                                                        }
                                                    }}
                                                />
                                                <Button onClick={() => {
                                                    if (newInfra.trim()) {
                                                        setData({
                                                            ...data,
                                                            technicalScope: {
                                                                ...data.technicalScope,
                                                                infrastructureComponents: [...data.technicalScope.infrastructureComponents, newInfra.trim()],
                                                            },
                                                        });
                                                        setNewInfra('');
                                                    }
                                                }} size="sm">Add</Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {data.technicalScope.infrastructureComponents.map((infra, idx) => (
                                                    <Badge key={idx} variant="secondary" className="gap-1">
                                                        {infra}
                                                        <button onClick={() => {
                                                            setData({
                                                                ...data,
                                                                technicalScope: {
                                                                    ...data.technicalScope,
                                                                    infrastructureComponents: data.technicalScope.infrastructureComponents.filter((_, i) => i !== idx),
                                                                },
                                                            });
                                                        }}>×</button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Critical Data Assets</Label>
                                            <div className="flex gap-2 mb-2">
                                                <Input
                                                    placeholder="e.g., Customer PII, Payment Card Data"
                                                    value={newDataAsset}
                                                    onChange={(e) => setNewDataAsset(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter' && newDataAsset.trim()) {
                                                            setData({
                                                                ...data,
                                                                technicalScope: {
                                                                    ...data.technicalScope,
                                                                    dataAssets: [...data.technicalScope.dataAssets, newDataAsset.trim()],
                                                                },
                                                            });
                                                            setNewDataAsset('');
                                                        }
                                                    }}
                                                />
                                                <Button onClick={() => {
                                                    if (newDataAsset.trim()) {
                                                        setData({
                                                            ...data,
                                                            technicalScope: {
                                                                ...data.technicalScope,
                                                                dataAssets: [...data.technicalScope.dataAssets, newDataAsset.trim()],
                                                            },
                                                        });
                                                        setNewDataAsset('');
                                                    }
                                                }} size="sm">Add</Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {data.technicalScope.dataAssets.map((asset, idx) => (
                                                    <Badge key={idx} variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 border-yellow-300">
                                                        {asset}
                                                        <button onClick={() => {
                                                            setData({
                                                                ...data,
                                                                technicalScope: {
                                                                    ...data.technicalScope,
                                                                    dataAssets: data.technicalScope.dataAssets.filter((_, i) => i !== idx),
                                                                },
                                                            });
                                                        }}>×</button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">External Dependencies</Label>
                                            <div className="flex gap-2 mb-2">
                                                <Input
                                                    placeholder="e.g., Stripe Payment API, SendGrid Email"
                                                    value={newDependency}
                                                    onChange={(e) => setNewDependency(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter' && newDependency.trim()) {
                                                            setData({
                                                                ...data,
                                                                technicalScope: {
                                                                    ...data.technicalScope,
                                                                    externalDependencies: [...data.technicalScope.externalDependencies, newDependency.trim()],
                                                                },
                                                            });
                                                            setNewDependency('');
                                                        }
                                                    }}
                                                />
                                                <Button onClick={() => {
                                                    if (newDependency.trim()) {
                                                        setData({
                                                            ...data,
                                                            technicalScope: {
                                                                ...data.technicalScope,
                                                                externalDependencies: [...data.technicalScope.externalDependencies, newDependency.trim()],
                                                            },
                                                        });
                                                        setNewDependency('');
                                                    }
                                                }} size="sm">Add</Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {data.technicalScope.externalDependencies.map((dep, idx) => (
                                                    <Badge key={idx} variant="secondary" className="gap-1 bg-purple-100 text-purple-800 border-purple-300">
                                                        {dep}
                                                        <button onClick={() => {
                                                            setData({
                                                                ...data,
                                                                technicalScope: {
                                                                    ...data.technicalScope,
                                                                    externalDependencies: data.technicalScope.externalDependencies.filter((_, i) => i !== idx),
                                                                },
                                                            });
                                                        }}>×</button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Stage 3: Decomposition */}
                                {stage.id === 3 && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <p className="text-sm text-blue-900">
                                                <strong>Note:</strong> Data flows are automatically captured from your architecture diagram in the previous step.
                                                {components && components.length > 0 && ` You have ${components.length} components defined.`}
                                            </p>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Trust Boundaries</Label>
                                            <div className="flex gap-2 mb-2">
                                                <Input
                                                    placeholder="e.g., Internet/DMZ, DMZ/Internal Network"
                                                    value={newBoundary}
                                                    onChange={(e) => setNewBoundary(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter' && newBoundary.trim()) {
                                                            setData({
                                                                ...data,
                                                                decomposition: {
                                                                    ...data.decomposition,
                                                                    trustBoundaries: [...data.decomposition.trustBoundaries, newBoundary.trim()],
                                                                },
                                                            });
                                                            setNewBoundary('');
                                                        }
                                                    }}
                                                />
                                                <Button onClick={() => {
                                                    if (newBoundary.trim()) {
                                                        setData({
                                                            ...data,
                                                            decomposition: {
                                                                ...data.decomposition,
                                                                trustBoundaries: [...data.decomposition.trustBoundaries, newBoundary.trim()],
                                                            },
                                                        });
                                                        setNewBoundary('');
                                                    }
                                                }} size="sm">Add</Button>
                                            </div>
                                            <div className="space-y-1">
                                                {data.decomposition.trustBoundaries.map((boundary, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2 bg-orange-50 rounded text-sm">
                                                        <span>{boundary}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setData({
                                                                ...data,
                                                                decomposition: {
                                                                    ...data.decomposition,
                                                                    trustBoundaries: data.decomposition.trustBoundaries.filter((_, i) => i !== idx),
                                                                },
                                                            })}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Entry/Exit Points</Label>
                                            <div className="flex gap-2 mb-2">
                                                <Input
                                                    placeholder="e.g., HTTPS Endpoint /api/login, SSH Port 22"
                                                    value={newEntryPoint}
                                                    onChange={(e) => setNewEntryPoint(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter' && newEntryPoint.trim()) {
                                                            setData({
                                                                ...data,
                                                                decomposition: {
                                                                    ...data.decomposition,
                                                                    entryExitPoints: [...data.decomposition.entryExitPoints, newEntryPoint.trim()],
                                                                },
                                                            });
                                                            setNewEntryPoint('');
                                                        }
                                                    }}
                                                />
                                                <Button onClick={() => {
                                                    if (newEntryPoint.trim()) {
                                                        setData({
                                                            ...data,
                                                            decomposition: {
                                                                ...data.decomposition,
                                                                entryExitPoints: [...data.decomposition.entryExitPoints, newEntryPoint.trim()],
                                                            },
                                                        });
                                                        setNewEntryPoint('');
                                                    }
                                                }} size="sm">Add</Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {data.decomposition.entryExitPoints.map((point, idx) => (
                                                    <Badge key={idx} variant="secondary" className="gap-1">
                                                        {point}
                                                        <button onClick={() => {
                                                            setData({
                                                                ...data,
                                                                decomposition: {
                                                                    ...data.decomposition,
                                                                    entryExitPoints: data.decomposition.entryExitPoints.filter((_, i) => i !== idx),
                                                                },
                                                            });
                                                        }}>×</button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Stage 4: Threat Analysis */}
                                {stage.id === 4 && (
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-semibold mb-3 block">Threat Actors</Label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                                {THREAT_ACTOR_TEMPLATES.map((template, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => addThreatActor(template)}
                                                        className="p-3 border-2 border-dashed rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all text-left"
                                                    >
                                                        <div className="font-semibold text-sm">{template.name}</div>
                                                        <div className="text-xs text-muted-foreground mt-1">{template.motivation}</div>
                                                        <Badge variant="outline" className="mt-2 text-xs">
                                                            {template.capability} Capability
                                                        </Badge>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="space-y-2">
                                                {data.threatAnalysis.threatActors.map((actor, idx) => (
                                                    <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="font-semibold text-sm">{actor.name}</div>
                                                                <div className="text-xs text-gray-600 mt-1">Motivation: {actor.motivation}</div>
                                                                <Badge variant="outline" className="mt-2 text-xs bg-white">
                                                                    {actor.capability} Capability
                                                                </Badge>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setData({
                                                                    ...data,
                                                                    threatAnalysis: {
                                                                        ...data.threatAnalysis,
                                                                        threatActors: data.threatAnalysis.threatActors.filter((_, i) => i !== idx),
                                                                    },
                                                                })}
                                                            >
                                                                ×
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Threat Scenarios</Label>
                                            <div className="flex gap-2 mb-2">
                                                <Input
                                                    placeholder="e.g., External attacker exploits SQL injection to access customer database"
                                                    value={newThreatScenario}
                                                    onChange={(e) => setNewThreatScenario(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter' && newThreatScenario.trim()) {
                                                            setData({
                                                                ...data,
                                                                threatAnalysis: {
                                                                    ...data.threatAnalysis,
                                                                    threatScenarios: [...data.threatAnalysis.threatScenarios, newThreatScenario.trim()],
                                                                },
                                                            });
                                                            setNewThreatScenario('');
                                                        }
                                                    }}
                                                />
                                                <Button onClick={() => {
                                                    if (newThreatScenario.trim()) {
                                                        setData({
                                                            ...data,
                                                            threatAnalysis: {
                                                                ...data.threatAnalysis,
                                                                threatScenarios: [...data.threatAnalysis.threatScenarios, newThreatScenario.trim()],
                                                            },
                                                        });
                                                        setNewThreatScenario('');
                                                    }
                                                }} size="sm">Add</Button>
                                            </div>
                                            <div className="space-y-1">
                                                {data.threatAnalysis.threatScenarios.map((scenario, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2 bg-amber-50 rounded text-sm">
                                                        <span>{scenario}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setData({
                                                                ...data,
                                                                threatAnalysis: {
                                                                    ...data.threatAnalysis,
                                                                    threatScenarios: data.threatAnalysis.threatScenarios.filter((_, i) => i !== idx),
                                                                },
                                                            })}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Stages 5-7: Simplified UI for now */}
                                {stage.id >= 5 && (
                                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-dashed border-blue-200">
                                        <div className="text-center">
                                            <AlertTriangle className="w-12 h-12 mx-auto text-blue-500 mb-3" />
                                            <h3 className="font-semibold text-lg mb-2">Stage {stage.id}: {stage.title}</h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                This stage is integrated with the existing threat analysis workflow.
                                                Continue to the Analysis step to proceed.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        )}
                    </Card>
                );
            })}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => { }}>
                    Save Progress
                </Button>
                <Button
                    onClick={() => onComplete(data)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                    disabled={!isStageComplete(1) || !isStageComplete(2)}
                >
                    Continue to Threat Analysis
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
