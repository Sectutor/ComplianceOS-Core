import { useState } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@complianceos/ui/ui/card';
import { Button } from '@complianceos/ui/ui/button';
import { Badge } from '@complianceos/ui/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@complianceos/ui/ui/tabs';
import { Input } from '@complianceos/ui/ui/input';
import { Bug, Search, AlertTriangle, FileWarning, Globe, Hash, Mail, Plus, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageGuide } from '@/components/PageGuide';
import { Breadcrumb } from '@/components/Breadcrumb';

const mockIOCs = [
    { id: 'IOC-001', indicator: '192.168.1.100', type: 'ip', reputation: 'malicious', confidence: 85, source: 'AlienVault OTX', tags: ['c2', 'botnet'] },
    { id: 'IOC-002', indicator: 'malware.example.com', type: 'domain', reputation: 'malicious', confidence: 92, source: 'VirusTotal', tags: ['malware', 'phishing'] },
    { id: 'IOC-003', indicator: 'a1b2c3d4e5f6...', type: 'hash', reputation: 'suspicious', confidence: 65, source: 'AbuseIPDB', tags: ['spam'] },
    { id: 'IOC-004', indicator: '10.0.0.50', type: 'ip', reputation: 'clean', confidence: 95, source: 'AlienVault OTX', tags: [] },
    { id: 'IOC-005', indicator: 'evil-panel.xyz', type: 'domain', reputation: 'malicious', confidence: 98, source: 'VirusTotal', tags: ['c2', 'ransomware'] }
];

const mockReports = [
    { id: 'RPT-001', title: 'APT29 Campaign 2026', severity: 'critical', summary: 'New APT29 activity targeting government entities', iocs: 45, published: '2026-02-20T00:00:00Z', source: 'CISA' },
    { id: 'RPT-002', title: 'Emotet Resurgence', severity: 'high', summary: 'Emotet malware distributing through phishing', iocs: 23, published: '2026-02-18T00:00:00Z', source: 'US-CERT' },
    { id: 'RPT-003', title: 'Log4j Vulnerability Advisory', severity: 'critical', summary: 'New Log4j variants being exploited', iocs: 12, published: '2026-02-15T00:00:00Z', source: 'NVD' }
];

const typeIcons: Record<string, any> = {
    ip: Globe,
    domain: Globe,
    hash: Hash,
    email: Mail
};

const severityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
};

const reputationColors: Record<string, string> = {
    malicious: 'text-red-600',
    suspicious: 'text-yellow-600',
    clean: 'text-green-600',
    unknown: 'text-slate-400'
};

export default function ThreatIntelDashboard() {
    const params = useParams();
    const clientId = params.id;
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <Breadcrumb items={[{ label: "Cyber Resilience", href: `/clients/${clientId}/cyber` }, { label: "Threat Intelligence" }]} />
                        <div className="flex gap-3">
                            <PageGuide
                                title="Threat Intelligence"
                                description="Operationalize threat data with IOC tracking, intel reports, and active feed management."
                                rationale="Threat intelligence converts raw data into actionable insights that help defenders understand, prioritize, and respond to threats. It shifts security from reactive to proactive."
                                howToUse={[
                                    {
                                        step: "Search IOCs",
                                        description: "Use the search bar to look up specific IP addresses, domains, or file hashes against your intel database.",
                                        targetId: "ti-ioc-search"
                                    },
                                    {
                                        step: "Add New IOC",
                                        description: "Manually add new Indicators of Compromise discovered during an investigation.",
                                        targetId: "ti-add-ioc-btn"
                                    },
                                    {
                                        step: "Review Reports",
                                        description: "Consume curated threat intelligence reports from trusted sources like CISA and US-CERT.",
                                        targetId: "ti-reports-tab"
                                    },
                                    {
                                        step: "Manage Feeds",
                                        description: "Configure and monitor your active threat intelligence subscriptions.",
                                        targetId: "ti-feeds-tab"
                                    }
                                ]}
                                scenarios={[
                                    {
                                        title: "Confirming a Compromise",
                                        example: "An analyst observes a suspicious outbound connection. Search for the destination IP in the IOC database to confirm if it's a known malicious C2 server.",
                                        auditTip: "Auditors look for 'IOC Integration'. Ensure your SIEM is cross-referencing logs against this IOC database through an automated feed."
                                    },
                                    {
                                        title: "Proactive APT Defense",
                                        example: "A new threat report indicates APT29 is targeting your sector. Review the extracted IOCs and block them at your perimeter before an attack occurs.",
                                        auditTip: "Document every proactive block as 'Preventive Control Evidence'. This is strong evidence during cybersecurity audits for frameworks like NIS2 and ISO 27001."
                                    }
                                ]}
                                integrations={[
                                    { name: "SIEM", description: "IOC feeds are pushed to SIEM for automatic correlation with network logs." },
                                    { name: "SOAR", description: "High-confidence IOCs can trigger automated SOAR playbooks." }
                                ]}
                            />
                            <div id="ti-ioc-search" className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search IOCs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-white border-slate-300 w-64"
                                />
                            </div>
                            <Button id="ti-add-ioc-btn" className="bg-orange-600 hover:bg-orange-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Add IOC
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <Card className="bg-white border-slate-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-500 text-sm">Total IOCs</p>
                                        <p className="text-3xl font-bold text-slate-900">{mockIOCs.length}</p>
                                    </div>
                                    <FileWarning className="h-8 w-8 text-orange-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-slate-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-500 text-sm">Malicious</p>
                                        <p className="text-3xl font-bold text-red-600">{mockIOCs.filter(i => i.reputation === 'malicious').length}</p>
                                    </div>
                                    <XCircle className="h-8 w-8 text-red-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-slate-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-500 text-sm">Threat Reports</p>
                                        <p className="text-3xl font-bold text-yellow-600">{mockReports.length}</p>
                                    </div>
                                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-slate-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-500 text-sm">Threat Feeds</p>
                                        <p className="text-3xl font-bold text-cyan-600">8</p>
                                    </div>
                                    <Globe className="h-8 w-8 text-cyan-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="iocs" className="space-y-4">
                        <TabsList className="bg-white border-slate-200">
                            <TabsTrigger value="iocs" className="data-[state=active]:bg-orange-600">Indicators of Compromise</TabsTrigger>
                            <TabsTrigger id="ti-reports-tab" value="reports" className="data-[state=active]:bg-orange-600">Threat Reports</TabsTrigger>
                            <TabsTrigger id="ti-feeds-tab" value="feeds" className="data-[state=active]:bg-orange-600">Threat Feeds</TabsTrigger>
                        </TabsList>

                        <TabsContent value="iocs">
                            <Card className="bg-white border-slate-200">
                                <CardHeader>
                                    <CardTitle>Indicators of Compromise</CardTitle>
                                    <CardDescription>Known malicious indicators from threat intelligence</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {mockIOCs.map((ioc) => {
                                            const TypeIcon = typeIcons[ioc.type] || Globe;
                                            return (
                                                <div key={ioc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2 rounded-lg ${ioc.reputation === 'malicious' ? 'bg-red-100' : ioc.reputation === 'suspicious' ? 'bg-yellow-100' : 'bg-green-100'}`}>
                                                            <TypeIcon className={`h-5 w-5 ${reputationColors[ioc.reputation]}`} />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold font-mono text-slate-900">{ioc.indicator}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-slate-500 uppercase">{ioc.type}</span>
                                                                <span className="text-slate-300">•</span>
                                                                <span className="text-xs text-slate-500">{ioc.source}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="text-sm text-slate-500">Confidence</p>
                                                            <p className={`font-semibold ${ioc.confidence >= 80 ? 'text-red-600' : ioc.confidence >= 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                                {ioc.confidence}%
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {ioc.tags.slice(0, 2).map((tag) => (
                                                                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                                                            ))}
                                                        </div>
                                                        <Button variant="ghost" size="sm">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="reports">
                            <Card className="bg-white border-slate-200">
                                <CardHeader>
                                    <CardTitle>Threat Intelligence Reports</CardTitle>
                                    <CardDescription>Latest threat reports from intelligence sources</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {mockReports.map((report) => (
                                            <div key={report.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="flex items-center gap-4">
                                                    <Badge className={severityColors[report.severity]}>{report.severity}</Badge>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{report.title}</p>
                                                        <p className="text-sm text-slate-500">{report.summary}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-sm text-slate-500">{report.iocs} IOCs</p>
                                                        <p className="text-xs text-slate-400">{report.source}</p>
                                                    </div>
                                                    <Button variant="outline" size="sm">
                                                        View Report
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="feeds">
                            <Card className="bg-white border-slate-200">
                                <CardHeader>
                                    <CardTitle>Threat Intelligence Feeds</CardTitle>
                                    <CardDescription>Subscribed threat intelligence feeds</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {['Critical Vulnerabilities', 'APT Activity', 'Malware Campaigns', 'C2 Communications', 'Phishing Domains', 'Botnet Activity'].map((feed) => (
                                            <div key={feed} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-semibold text-slate-900">{feed}</h3>
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                </div>
                                                <p className="text-sm text-slate-500">Active subscription</p>
                                            </div>
                                        ))}
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
