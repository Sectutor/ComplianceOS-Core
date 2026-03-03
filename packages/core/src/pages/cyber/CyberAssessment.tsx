
import { useState, useEffect } from "react";
import { useClientContext } from "@/contexts/ClientContext";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Progress } from "@complianceos/ui/ui/progress";
import { Badge } from "@complianceos/ui/ui/badge";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { PageGuide } from "@/components/PageGuide";

const NIS2_CHECKLIST = [
    {
        id: "risk_mgmt",
        category: "1. Risk Analysis & Information System Security Policies",
        questions: [
            { id: "rm_1", text: "Do you have a formal Risk Management Policy approved by top management?" },
            { id: "rm_2", text: "Is there an up-to-date asset inventory of all critical information systems?" },
            { id: "rm_3", text: "Are risk assessments conducted regularly (at least annually)?" }
        ]
    },
    {
        id: "incident_handling",
        category: "2. Incident Handling",
        questions: [
            { id: "ih_1", text: "Is there a documented Incident Response Plan (IRP)?" },
            { id: "ih_2", text: "Are you capable of reporting significant incidents to the CSIRT within 24 hours (early warning)?" },
            { id: "ih_3", text: "Are incidents tracked, logged, and analyzed for root causes?" }
        ]
    },
    {
        id: "bcp_dr",
        category: "3. Business Continuity & Crisis Management",
        questions: [
            { id: "bc_1", text: "Are backups performed regularly and tested for recoverability?" },
            { id: "bc_2", text: "Is there a Business Continuity Plan (BCP) in place for critical operations?" },
            { id: "bc_3", text: "Do you have a Crisis Management process to coordinate specific responses?" }
        ]
    },
    {
        id: "supply_chain",
        category: "4. Supply Chain Security",
        questions: [
            { id: "sc_1", text: "Are security requirements included in contracts with ICT suppliers?" },
            { id: "sc_2", text: "Do you assess the risks posed by immediate suppliers and service providers?" }
        ]
    },
    {
        id: "vuln_handling",
        category: "5. Vulnerability Handling & Disclosure",
        questions: [
            { id: "vh_1", text: "Is there a process for regular vulnerability scanning?" },
            { id: "vh_2", text: "Are patches applied within a defined timeframe based on severity?" }
        ]
    },
    {
        id: "effectiveness",
        category: "6. Assessment of Effectiveness",
        questions: [
            { id: "test_1", text: "Do you conduct regular penetration tests?" },
            { id: "test_2", text: "Are security audits (internal or external) performed annually?" }
        ]
    },
    {
        id: "hygiene",
        category: "7. Basic Cyber Hygiene & Training",
        questions: [
            { id: "tr_1", text: "Is cybersecurity training mandatory for all staff?" },
            { id: "tr_2", text: "Are best practices for password management and software updates enforced?" }
        ]
    },
    {
        id: "crypto",
        category: "8. Cryptography & Encryption",
        questions: [
            { id: "enc_1", text: "Is encryption used for data at rest containing sensitive info?" },
            { id: "enc_2", text: "Is encryption used for data in transit (TLS/SSL)?" }
        ]
    },
    {
        id: "hr_sec",
        category: "9. Human Resources Security",
        questions: [
            { id: "hr_1", text: "Are access rights revoked immediately upon employee termination?" },
            { id: "hr_2", text: "Are background checks performed for sensitive roles?" }
        ]
    },
    {
        id: "mfa",
        category: "10. Multi-Factor Authentication (MFA)",
        questions: [
            { id: "mfa_1", text: "Is MFA enabled for all remote access and administrative accounts?" },
            { id: "mfa_2", text: "Are secured voice/video/text communications used for critical operations?" }
        ]
    }
];

export default function CyberAssessment() {
    const [match, params] = useRoute("/clients/:clientId/cyber/assessment");
    const urlClientId = params?.clientId ? parseInt(params.clientId) : null;
    const { selectedClientId: contextClientId, setSelectedClientId } = useClientContext();
    
    // Use URL clientId if available, otherwise fall back to context
    const selectedClientId = urlClientId || contextClientId;
    
    // Sync URL clientId to context when it changes
    useEffect(() => {
        if (urlClientId && urlClientId !== contextClientId) {
            setSelectedClientId(urlClientId);
        }
    }, [urlClientId, contextClientId, setSelectedClientId]);
    
    const [responses, setResponses] = useState<Record<string, { answer: string; notes?: string; owner?: string; dueDate?: string }>>({});
    const [score, setScore] = useState(0);

    // Fetch existing data
    const { data: assessment, isLoading, refetch } = trpc.cyber.getAssessment.useQuery(
        { clientId: selectedClientId || 0 },
        {
            enabled: !!selectedClientId,
            onSuccess: (data: any) => {
                if (data?.responses) {
                    setResponses(data.responses as any);
                }
            }
        }
    );

    // Mutation
    const saveMutation = trpc.cyber.saveAssessment.useMutation({
        onSuccess: (data) => {
            console.log('[NIS2 Save] Success:', data);
            toast.success("Assessment saved successfully");
            refetch();
        },
        onError: (e) => {
            console.error('[NIS2 Save] Error:', e);
            toast.error(e.message || 'Failed to save assessment');
        }
    });

    // Debug logging
    useEffect(() => {
        console.log('[NIS2 Debug] selectedClientId:', selectedClientId);
        console.log('[NIS2 Debug] assessment data:', assessment);
        console.log('[NIS2 Debug] responses:', responses);
    }, [selectedClientId, assessment, responses]);

    // Calculate score
    useEffect(() => {
        let yesCount = 0;
        let totalQuestions = 0;

        NIS2_CHECKLIST.forEach(cat => {
            cat.questions.forEach(q => {
                totalQuestions++;
                if (responses[q.id]?.answer === "yes") yesCount++;
                if (responses[q.id]?.answer === "partial") yesCount += 0.5;
            });
        });

        const newScore = totalQuestions > 0 ? Math.round((yesCount / totalQuestions) * 100) : 0;
        setScore(newScore);
    }, [responses]);

    const handleAnswerChange = (qId: string, val: string) => {
        setResponses(prev => ({
            ...prev,
            [qId]: { ...prev[qId], answer: val }
        }));
    };

    const handleNotesChange = (qId: string, val: string) => {
        setResponses(prev => ({
            ...prev,
            [qId]: { ...prev[qId], notes: val }
        }));
    };

    const handleSave = () => {
        console.log('[NIS2 Save] handleSave called, selectedClientId:', selectedClientId);
        if (!selectedClientId) {
            console.error('[NIS2 Save] No clientId, aborting');
            toast.error('No client selected');
            return;
        }
        const status = score === 100 ? "completed" : score > 0 ? "in_progress" : "not_started";
        const payload = {
            clientId: selectedClientId,
            responses,
            score,
            status
        };
        console.log('[NIS2 Save] Sending payload:', payload);
        saveMutation.mutate(payload);
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <PageGuide
                    title="NIS2 Compliance Checklist"
                    description="Assess your readiness against Article 21 requirements."
                    rationale="Regular self-assessment is mandatory to ensure ongoing compliance with NIS2 security measures."
                    howToUse={[
                        { step: "Assess", description: "Answer questions across all 10 categories." },
                        { step: "Evidence", description: "Add notes or links to evidence for verification." },
                        { step: "Track", description: "Monitor your compliance score and progress." }
                    ]}
                />
                <div className="flex items-center gap-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="text-right">
                        <div className="text-3xl font-extrabold text-slate-900">{score}%</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Compliance</div>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saveMutation.isLoading}
                        className="bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-sky-100 transition-all active:scale-95"
                    >
                        {saveMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" /> Save Progress
                    </Button>
                </div>
            </div>

            {/* Progress Visualization */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden ring-1 ring-slate-200/50">
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="relative h-32 w-32 flex-shrink-0">
                            <svg className="h-full w-full" viewBox="0 0 100 100">
                                <circle className="text-slate-100" strokeWidth="10" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                                <circle
                                    className="text-[#3ABEF9] transition-all duration-1000 ease-out"
                                    strokeWidth="10"
                                    strokeDasharray={2 * Math.PI * 40}
                                    strokeDashoffset={2 * Math.PI * 40 * (1 - score / 100)}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="40" cx="50" cy="50"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-2xl font-black text-slate-900">{score}%</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4 w-full">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-lg text-slate-900">Overall Readiness</h3>
                                    <p className="text-sm text-slate-500">Based on {NIS2_CHECKLIST.reduce((acc, cat) => acc + cat.questions.length, 0)} mandatory measures.</p>
                                </div>
                                <span className={cn(
                                    "text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                                    score >= 100 ? "bg-green-100 text-green-700" : "bg-sky-100 text-sky-700"
                                )}>
                                    {score >= 100 ? "Compliant" : "In Progress"}
                                </span>
                            </div>
                            <Progress value={score} className="h-4 rounded-full bg-slate-100" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Checklist */}
            <div className="space-y-8 pb-12">
                {NIS2_CHECKLIST.map((category, catIdx) => (
                    <Card key={category.id} className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden ring-1 ring-slate-200/50 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${catIdx * 100}ms` }}>
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                            <CardTitle className="text-xl font-bold flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-[#1C4D8D] text-white flex items-center justify-center text-sm">
                                        {catIdx + 1}
                                    </div>
                                    {category.category}
                                </div>
                                {category.questions.every(q => responses[q.id]?.answer === 'yes') ? (
                                    <Badge className="bg-green-500 text-white border-none font-bold">COMPLETED</Badge>
                                ) : (
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Section {catIdx + 1}</div>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {category.questions.map((q, qIdx) => (
                                    <div key={q.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 hover:bg-slate-50/50 transition-colors">
                                        <div className="md:col-span-6">
                                            <div className="flex gap-4">
                                                <span className="text-slate-300 text-sm font-black mt-0.5">{qIdx + 1}.</span>
                                                <p className="text-[15px] font-bold text-slate-800 leading-relaxed">{q.text}</p>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <Select
                                                value={responses[q.id]?.answer || "not_started"}
                                                onValueChange={(val) => handleAnswerChange(q.id, val)}
                                            >
                                                <SelectTrigger className={cn(
                                                    "h-10 text-xs font-bold rounded-xl border-none ring-1 ring-inset transition-all",
                                                    responses[q.id]?.answer === 'yes' ? "bg-green-50 text-green-700 ring-green-200" :
                                                        responses[q.id]?.answer === 'partial' ? "bg-amber-50 text-amber-700 ring-amber-200" :
                                                            "bg-slate-50 text-slate-500 ring-slate-200"
                                                )}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-200">
                                                    <SelectItem value="not_started">Gap / Not Started</SelectItem>
                                                    <SelectItem value="partial">In Progress</SelectItem>
                                                    <SelectItem value="yes">Implemented</SelectItem>
                                                    <SelectItem value="na">N/A</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="md:col-span-4">
                                            <Textarea
                                                placeholder="Add implementation notes or evidence links..."
                                                className="min-h-[2.5rem] h-10 text-sm py-2 px-4 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20 transition-all"
                                                value={responses[q.id]?.notes || ""}
                                                onChange={(e) => handleNotesChange(q.id, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
