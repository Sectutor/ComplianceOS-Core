import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";

interface DomainScore {
    domain: string;
    score: number;
    fullMark: number;
}

interface GapRadarChartProps {
    controls: Array<{
        category?: string | null;
        controlId: string;
    }>;
    responses: Array<{
        controlId: string;
        currentStatus?: string | null;
        targetStatus?: string | null;
    }>;
    framework: string;
}

// Status to score mapping
const statusScores: Record<string, number> = {
    'fully_implemented': 100,
    'implemented': 100,
    'partially_implemented': 60,
    'in_progress': 40,
    'planned': 20,
    'not_implemented': 0,
    'not_applicable': 100, // Treat N/A as compliant
};

// Framework-specific domain ordering
const frameworkDomains: Record<string, string[]> = {
    'NIST CSF': ['GOVERN', 'IDENTIFY', 'PROTECT', 'DETECT', 'RESPOND', 'RECOVER'],
    'NIST CSF 2.0': ['GOVERN', 'IDENTIFY', 'PROTECT', 'DETECT', 'RESPOND', 'RECOVER'],
    'ISO 27001': ['Context', 'Leadership', 'Planning', 'Support', 'Operation', 'Performance', 'Improvement'],
    'ISO 27001:2022': ['Context', 'Leadership', 'Planning', 'Support', 'Operation', 'Performance', 'Improvement'],
    'SOC 2': ['Security', 'Availability', 'Processing Integrity', 'Confidentiality', 'Privacy'],
};

export function GapRadarChart({ controls, responses, framework }: GapRadarChartProps) {
    // Get the response for a control
    const getResponse = (controlId: string) => responses.find(r => r.controlId === controlId);

    // Calculate score by domain
    const calculateDomainScores = (): DomainScore[] => {
        // Group controls by domain
        const domainGroups: Record<string, typeof controls> = {};

        controls.forEach(c => {
            const category = c.category || 'Other';
            if (!domainGroups[category]) {
                domainGroups[category] = [];
            }
            domainGroups[category].push(c);
        });

        // Get preferred domain order for this framework
        const preferredOrder = frameworkDomains[framework] || [];

        // Calculate average score for each domain
        const scores: DomainScore[] = [];

        // First, add domains in preferred order
        preferredOrder.forEach(domain => {
            const domainControls = domainGroups[domain];
            if (domainControls && domainControls.length > 0) {
                const totalScore = domainControls.reduce((sum, c) => {
                    const response = getResponse(c.controlId);
                    const status = response?.currentStatus || 'not_implemented';
                    return sum + (statusScores[status] ?? 0);
                }, 0);

                scores.push({
                    domain: domain.length > 10 ? domain.substring(0, 10) + '...' : domain,
                    score: Math.round(totalScore / domainControls.length),
                    fullMark: 100
                });
                delete domainGroups[domain];
            }
        });

        // Then add any remaining domains
        Object.keys(domainGroups).sort().forEach(domain => {
            const domainControls = domainGroups[domain];
            if (domainControls.length > 0) {
                const totalScore = domainControls.reduce((sum, c) => {
                    const response = getResponse(c.controlId);
                    const status = response?.currentStatus || 'not_implemented';
                    return sum + (statusScores[status] ?? 0);
                }, 0);

                scores.push({
                    domain: domain.length > 10 ? domain.substring(0, 10) + '...' : domain,
                    score: Math.round(totalScore / domainControls.length),
                    fullMark: 100
                });
            }
        });

        return scores;
    };

    const data = calculateDomainScores();

    // Calculate overall average
    const overallScore = data.length > 0
        ? Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length)
        : 0;

    if (data.length === 0) {
        return (
            <Card className="lg:col-span-5 bg-white border-slate-200 shadow-sm">
                <CardContent className="p-8 flex items-center justify-center text-muted-foreground">
                    No domain data available
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="lg:col-span-5 bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-0">
                <CardTitle className="text-sm font-bold text-slate-700 flex items-center justify-between">
                    <span>Compliance by Domain</span>
                    <span className="text-2xl font-black text-slate-900">{overallScore}%</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis
                            dataKey="domain"
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{ fill: '#94a3b8', fontSize: 9 }}
                            tickCount={5}
                        />
                        <Radar
                            name="Current"
                            dataKey="score"
                            stroke="#0ea5e9"
                            fill="#0ea5e9"
                            fillOpacity={0.3}
                            strokeWidth={2}
                        />
                        <Tooltip
                            formatter={(value: number) => [`${value}%`, 'Compliance']}
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
