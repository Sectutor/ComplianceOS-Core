
import { useState, useEffect } from "react";
import { useClientContext } from "@/contexts/ClientContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Progress } from "@complianceos/ui/ui/progress";
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
import CyberLayout from "./CyberLayout";
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
    const { selectedClientId } = useClientContext();
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
        onSuccess: () => {
            toast.success("Assessment saved successfully");
            refetch();
        },
        onError: (e) => toast.error(e.message)
    });

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
        if (!selectedClientId) return;
        const status = score === 100 ? "completed" : score > 0 ? "in_progress" : "not_started";
        saveMutation.mutate({
            clientId: selectedClientId || 0,
            responses,
            score,
            status
        });
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <CyberLayout>
            <div className="space-y-6">
                {/* Header */}
                {/* Header */}
                <div className="flex items-center justify-between">
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
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-2xl font-bold">{score}%</div>
                            <div className="text-xs text-muted-foreground">Compliance Score</div>
                        </div>
                        <Button onClick={handleSave} disabled={saveMutation.isLoading}>
                            {saveMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" /> Save Progress
                        </Button>
                    </div>
                </div>

                {/* Progress */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Overall Progress</span>
                                <span className={score >= 100 ? "text-green-600 font-medium" : "text-muted-foreground"}>
                                    {score >= 100 ? "Compliant" : `${score}%`}
                                </span>
                            </div>
                            <Progress value={score} className="h-3" />
                        </div>
                    </CardContent>
                </Card>

                {/* Checklist */}
                <div className="space-y-6">
                    {NIS2_CHECKLIST.map((category) => (
                        <Card key={category.id}>
                            <CardHeader className="bg-muted/30 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {category.category}
                                    {category.questions.every(q => responses[q.id]?.answer === 'yes') && (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-0 pt-0">
                                <div className="divide-y">
                                    {category.questions.map((q, idx) => (
                                        <div key={q.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 hover:bg-slate-50 transition-colors">
                                            <div className="md:col-span-6">
                                                <div className="flex gap-3">
                                                    <span className="text-muted-foreground text-xs font-mono mt-1 w-6 shrink-0">{idx + 1}.</span>
                                                    <p className="text-sm font-medium leading-relaxed">{q.text}</p>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2">
                                                <Select
                                                    value={responses[q.id]?.answer || "not_started"}
                                                    onValueChange={(val) => handleAnswerChange(q.id, val)}
                                                >
                                                    <SelectTrigger className={cn("h-8 text-xs font-medium border-0 ring-1 ring-inset",
                                                        responses[q.id]?.answer === 'yes' ? "bg-green-50 text-green-700 ring-green-600/20" :
                                                            responses[q.id]?.answer === 'partial' ? "bg-yellow-50 text-yellow-700 ring-yellow-600/20" :
                                                                "bg-slate-50 text-slate-600 ring-slate-400/20"
                                                    )}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
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
                                                    className="min-h-[2.5rem] text-xs resize-y"
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
        </CyberLayout>
    );
}
