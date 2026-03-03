import { useState } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Button } from '@complianceos/ui/ui/button';
import { Badge } from '@complianceos/ui/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { Play, Activity, FileText, CheckCircle, Clock, AlertTriangle, User, Plus, Search } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageGuide } from '@/components/PageGuide';
import { Breadcrumb } from '@/components/Breadcrumb';

const mockPlaybooks = [
    { id: 'PB-001', name: 'Phishing Response', description: 'Automated response to suspected phishing', status: 'active', successRate: 92, avgDuration: 45 },
    { id: 'PB-002', name: 'Malware Containment', description: 'Isolate endpoint and block malware', status: 'active', successRate: 88, avgDuration: 120 },
    { id: 'PB-003', name: 'Brute Force Protection', description: 'Block IP after failed logins', status: 'active', successRate: 95, avgDuration: 15 },
    { id: 'PB-004', name: 'Data Exfiltration Response', description: 'Block transfer and notify DLP', status: 'active', successRate: 78, avgDuration: 180 },
    { id: 'PB-005', name: 'Vulnerability Remediation', description: 'Patch critical vulnerabilities', status: 'draft', successRate: 0, avgDuration: 0 }
];

const mockCases = [
    { id: 'CASE-001', title: 'Suspected Phishing Campaign', severity: 'high', status: 'open', assignee: 'John Smith', created: '2026-02-24T09:00:00Z', playbook: 'Phishing Response' },
    { id: 'CASE-002', title: 'Ransomware Detection', severity: 'critical', status: 'investigating', assignee: 'Security Team', created: '2026-02-23T22:15:00Z', playbook: 'Malware Containment' },
    { id: 'CASE-003', title: 'Unauthorized Access Attempt', severity: 'medium', status: 'resolved', assignee: 'Jane Doe', created: '2026-02-24T08:30:00Z', playbook: 'Brute Force Protection' }
];

const severityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
};

export default function SOARDashboard() {
    const params = useParams();
    const clientId = params.id;

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <Breadcrumb items={[{ label: "Cyber Resilience", href: `/clients/${clientId}/cyber` }, { label: "SOAR" }]} />
                        <div className="flex gap-3">
                            <PageGuide
                                title="SOAR Dashboard"
                                description="Automate security operations with orchestrated playbooks and case management."
                                rationale="Security Orchestration, Automation and Response (SOAR) reduces mean time to respond (MTTR) to threats by automating repetitive tasks and providing analysts with structured case workflows."
                                howToUse={[
                                    {
                                        step: "Manage Cases",
                                        description: "Review and assign open security cases, tracking them from detection to resolution.",
                                        targetId: "soar-tabs-list"
                                    },
                                    {
                                        step: "Execute Playbooks",
                                        description: "Trigger automated playbooks like 'Phishing Response' or 'Malware Containment' against active threats.",
                                        targetId: "soar-playbooks-tab"
                                    },
                                    {
                                        step: "Create Case",
                                        description: "Manually create a new case for threats detected outside your automated rules.",
                                        targetId: "soar-create-case-btn"
                                    },
                                    {
                                        step: "Measure Performance",
                                        description: "Check the Metrics tab to track automation success rates and response times.",
                                        targetId: "soar-metrics-tab"
                                    }
                                ]}
                                scenarios={[
                                    {
                                        title: "Automated Phishing Response",
                                        example: "An email security gateway flags a spear-phishing campaign. The 'Phishing Response' playbook automatically quarantines affected mailboxes and notifies users.",
                                        auditTip: "Auditors want to see 'Playbook Effectiveness'. Track success rate and average resolution time per playbook to demonstrate a mature SOC."
                                    },
                                    {
                                        title: "Ransomware Containment",
                                        example: "EDR detects ransomware on an endpoint. The 'Malware Containment' playbook isolates the machine from the network within seconds, stopping lateral movement.",
                                        auditTip: "Ensure every executed playbook results in a closed case with documented outcomes to maintain a clear chain of evidence for regulators."
                                    }
                                ]}
                                integrations={[
                                    { name: "SIEM", description: "SIEM alerts automatically create SOAR cases based on correlation rules." },
                                    { name: "Threat Intel", description: "IOCs from threat intel are used to enrich cases with context." }
                                ]}
                            />
                            <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                                <Search className="h-4 w-4 mr-2" />
                                Search Cases
                            </Button>
                            <Button id="soar-create-case-btn" className="bg-purple-600 hover:bg-purple-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Case
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <Card className="bg-white border-slate-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-500 text-sm">Open Cases</p>
                                        <p className="text-3xl font-bold text-slate-900">{mockCases.filter(c => c.status !== 'resolved').length}</p>
                                    </div>
                                    <FileText className="h-8 w-8 text-purple-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-slate-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-500 text-sm">Active Playbooks</p>
                                        <p className="text-3xl font-bold text-green-600">{mockPlaybooks.filter(p => p.status === 'active').length}</p>
                                    </div>
                                    <Activity className="h-8 w-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-slate-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-500 text-sm">Automation Rate</p>
                                        <p className="text-3xl font-bold text-blue-600">78%</p>
                                    </div>
                                    <Play className="h-8 w-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-slate-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-500 text-sm">Avg Resolution</p>
                                        <p className="text-3xl font-bold text-cyan-600">2.5h</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-cyan-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="cases" className="space-y-4">
                        <TabsList id="soar-tabs-list" className="bg-white border-slate-200">
                            <TabsTrigger value="cases" className="data-[state=active]:bg-purple-600">Cases</TabsTrigger>
                            <TabsTrigger id="soar-playbooks-tab" value="playbooks" className="data-[state=active]:bg-purple-600">Playbooks</TabsTrigger>
                            <TabsTrigger id="soar-metrics-tab" value="metrics" className="data-[state=active]:bg-purple-600">Metrics</TabsTrigger>
                        </TabsList>

                        <TabsContent value="cases">
                            <Card className="bg-white border-slate-200">
                                <CardHeader>
                                    <CardTitle>Security Cases</CardTitle>
                                    <CardDescription>Active and recent security cases</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {mockCases.map((caseItem) => (
                                            <div key={caseItem.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="flex items-center gap-4">
                                                    <Badge className={severityColors[caseItem.severity]}>{caseItem.severity}</Badge>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{caseItem.title}</p>
                                                        <p className="text-sm text-slate-500">{caseItem.playbook} • {caseItem.created}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <User className="h-4 w-4" />
                                                        <span className="text-sm">{caseItem.assignee}</span>
                                                    </div>
                                                    <span className={`px-2 py-1 text-xs rounded ${caseItem.status === 'open' ? 'bg-red-100 text-red-700' :
                                                        caseItem.status === 'investigating' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>
                                                        {caseItem.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="playbooks">
                            <Card className="bg-white border-slate-200">
                                <CardHeader>
                                    <CardTitle>Automation Playbooks</CardTitle>
                                    <CardDescription>Available security playbooks</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {mockPlaybooks.map((playbook) => (
                                            <div key={playbook.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${playbook.status === 'active' ? 'bg-green-100' : 'bg-slate-100'}`}>
                                                        <Play className={`h-5 w-5 ${playbook.status === 'active' ? 'text-green-600' : 'text-slate-500'}`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{playbook.name}</p>
                                                        <p className="text-sm text-slate-500">{playbook.description}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {playbook.status === 'active' && (
                                                        <>
                                                            <div className="text-right">
                                                                <p className="text-sm text-slate-500">Success Rate</p>
                                                                <p className="font-semibold text-green-600">{playbook.successRate}%</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm text-slate-500">Avg Duration</p>
                                                                <p className="font-semibold text-slate-900">{playbook.avgDuration}s</p>
                                                            </div>
                                                        </>
                                                    )}
                                                    <Badge variant={playbook.status === 'active' ? 'default' : 'secondary'}>
                                                        {playbook.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="metrics">
                            <Card className="bg-white border-slate-200">
                                <CardHeader>
                                    <CardTitle>SOAR Metrics</CardTitle>
                                    <CardDescription>Automation performance metrics</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-6 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                            <p className="text-4xl font-bold text-purple-600">156</p>
                                            <p className="text-slate-500">Total Cases</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                            <p className="text-4xl font-bold text-green-600">89%</p>
                                            <p className="text-slate-500">Success Rate</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                            <p className="text-4xl font-bold text-blue-600">342</p>
                                            <p className="text-slate-500">Playbook Executions</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </DashboardLayout>
    );
}
