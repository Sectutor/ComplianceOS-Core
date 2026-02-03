import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import {
    Loader2,
    Save,
    ChevronRight,
    ChevronLeft,
    CheckCircle,
    ClipboardCheck,
    AlertTriangle,
    Shield,
    Info,
    ArrowLeft,
    Files,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@complianceos/ui/ui/progress";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { Label } from "@complianceos/ui/ui/label";
import { Separator } from "@complianceos/ui/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@complianceos/ui/ui/alert";
import { Breadcrumb } from "@/components/Breadcrumb";

const SECTIONS = [
    { id: "screening", title: "1. DPI Screening", description: "Identify if a DPI Assessment is mandatory" },
    { id: "description", title: "2. Description of Processing", description: "Nature, scope, context and purposes" },
    { id: "necessity", title: "3. Necessity & Proportionality", description: "Compliance and data subject rights" },
    { id: "risks", title: "4. Risk Identification", description: "Assessment of risks to rights and freedoms" },
    { id: "mitigation", title: "5. Mitigation Measures", description: "Measures to reduce or eliminate risks" },
    { id: "approval", title: "6. Approval / Review", description: "Final sign-off and review cycle" }
];

export default function DPIAQuestionnaire() {
    const { id, dpiaId } = useParams<{ id: string; dpiaId: string }>();
    const [, setLocation] = useLocation();
    const clientId = parseInt(id || "0");
    const dId = parseInt(dpiaId || "0");

    const [activeSection, setActiveSection] = useState(0);
    const [responses, setResponses] = useState<any>({});

    const { data: dpia, isLoading, refetch } = trpc.dpia.get.useQuery({ id: dId });
    const saveMutation = trpc.dpia.saveResponses.useMutation({
        onSuccess: () => {
            toast.success("Progress saved successfully");
            refetch();
        },
        onError: (err) => {
            toast.error(`Failed to save progress: ${err.message}`);
        }
    });

    useEffect(() => {
        if (dpia?.questionnaireData) {
            setResponses(dpia.questionnaireData);
        }
    }, [dpia]);

    const handleSave = (newStatus?: any) => {
        saveMutation.mutate({
            id: dId,
            responses,
            status: newStatus || dpia?.status
        });
    };

    const updateResponse = (key: string, value: any) => {
        setResponses((prev: any) => ({ ...prev, [key]: value }));
    };

    const nextSection = () => {
        if (activeSection < SECTIONS.length - 1) {
            setActiveSection(activeSection + 1);
            window.scrollTo(0, 0);
        }
    };

    const prevSection = () => {
        if (activeSection > 0) {
            setActiveSection(activeSection - 1);
            window.scrollTo(0, 0);
        }
    };

    const calculateProgress = () => {
        // Simple progress based on sections visited or fields filled?
        // Let's do fields filled in each section.
        return Math.round(((activeSection + 1) / SECTIONS.length) * 100);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!dpia) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Assessment not found or you do not have permission to view it.</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <Breadcrumb
                items={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Privacy", href: `/clients/${clientId}/privacy` },
                    { label: "DPIA", href: `/clients/${clientId}/privacy/dpia` },
                    { label: "Assessment" },
                ]}
            />
            {/* Header Sub-Nav */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocation(`/clients/${clientId}/privacy/dpia`)}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to DPI Assessments
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <ClipboardCheck className="h-6 w-6 text-indigo-600" />
                            {dpia?.title || "DPI Assessment"}
                        </h1>
                        <p className="text-sm text-muted-foreground">Comprehensive DPI Assessment</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleSave()}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Draft
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => handleSave('under_review')}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        Submit for Review
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar Navigation */}
                <div className="md:col-span-1 space-y-2">
                    <Card className="sticky top-6">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Assessment Progress</CardTitle>
                            <Progress value={calculateProgress()} className="h-2 mt-2" />
                            <div className="text-[10px] text-right text-muted-foreground mt-1">{calculateProgress()}% Complete</div>
                        </CardHeader>
                        <CardContent className="p-2 pt-0">
                            <div className="space-y-1">
                                {SECTIONS.map((section, idx) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(idx)}
                                        className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all flex items-center justify-between group ${activeSection === idx
                                            ? "bg-indigo-50 text-indigo-700 font-medium border-l-4 border-indigo-600"
                                            : "hover:bg-slate-50 text-slate-600 border-l-4 border-transparent"
                                            }`}
                                    >
                                        <span className="truncate">{section.title}</span>
                                        {activeSection > idx && <CheckCircle className="h-3 w-3 text-green-500" />}
                                        {activeSection === idx && <ChevronRight className="h-3 w-3 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-3 space-y-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="border-b bg-slate-50/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl text-slate-800">{SECTIONS[activeSection].title}</CardTitle>
                                    <CardDescription className="mt-1">{SECTIONS[activeSection].description}</CardDescription>
                                </div>
                                <Badge variant="outline" className="bg-white border-slate-200 text-slate-500">
                                    Section {activeSection + 1} of 6
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            {activeSection === 0 && <ScreeningSection responses={responses} onUpdate={updateResponse} />}
                            {activeSection === 1 && <DescriptionSection responses={responses} onUpdate={updateResponse} baseline={dpia} />}
                            {activeSection === 2 && <NecessitySection responses={responses} onUpdate={updateResponse} />}
                            {activeSection === 3 && <RiskSection responses={responses} onUpdate={updateResponse} />}
                            {activeSection === 4 && <MitigationSection responses={responses} onUpdate={updateResponse} baseline={dpia} />}
                            {activeSection === 5 && <ApprovalSection responses={responses} onUpdate={updateResponse} />}
                        </CardContent>
                        <Separator />
                        <div className="p-4 flex justify-between items-center bg-slate-50/30">
                            <Button
                                variant="ghost"
                                onClick={prevSection}
                                disabled={activeSection === 0}
                                className="text-slate-500"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous Section
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handleSave()} disabled={saveMutation.isPending}>
                                    {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                    Save Draft
                                </Button>
                                {activeSection < SECTIONS.length - 1 ? (
                                    <Button onClick={nextSection} className="bg-indigo-600 hover:bg-indigo-700 px-8">
                                        Next Section
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                ) : (
                                    <Button onClick={() => handleSave('under_review')} className="bg-green-600 hover:bg-green-700 px-8">
                                        Finalize Assessment
                                        <CheckCircle className="h-4 w-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// --- Section Components ---

function QuestionWrapper({ label, description, children, required }: any) {
    return (
        <div className="space-y-3 mb-8 last:mb-0">
            <div className="space-y-1">
                <Label className="text-base font-semibold text-slate-800">
                    {label} {required && <span className="text-red-500">*</span>}
                </Label>
                {description && <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>}
            </div>
            {children}
        </div>
    );
}

function ScreeningSection({ responses, onUpdate }: any) {
    return (
        <div className="space-y-2">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex gap-3 mb-6">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                    <p className="font-semibold">DPI Mandatory Triggers</p>
                    <p className="mt-1">Under GDPR, a DPI Assessment is required if the processing is likely to result in a high risk to the rights and freedoms of individuals.</p>
                </div>
            </div>

            <QuestionWrapper
                label="Systematic and Extensive Evaluation?"
                description="Does the project involve systematic and extensive evaluation of personal aspects relating to natural persons which is based on automated processing, including profiling?"
                required
            >
                <Textarea
                    value={responses.screeningEvaluation || ""}
                    onChange={e => onUpdate('screeningEvaluation', e.target.value)}
                    placeholder="Describe any profiling or automated decision-making..."
                />
            </QuestionWrapper>

            <QuestionWrapper
                label="Large Scale Processing of Sensitive Data?"
                description="Processing on a large scale of special categories of data (Article 9) or personal data relating to criminal convictions and offences (Article 10)?"
                required
            >
                <Textarea
                    value={responses.screeningSensitive || ""}
                    onChange={e => onUpdate('screeningSensitive', e.target.value)}
                    placeholder="What special categories are involved? What is the scale?"
                />
            </QuestionWrapper>

            <QuestionWrapper
                label="Systematic Monitoring of Publicly Accessible Areas?"
                description="For example, CCTV or tracking of individuals in public places."
            >
                <Textarea
                    value={responses.screeningMonitoring || ""}
                    onChange={e => onUpdate('screeningMonitoring', e.target.value)}
                    placeholder="Describe any public space monitoring..."
                />
            </QuestionWrapper>

            <QuestionWrapper
                label="New Technology?"
                description="Does the project involve the use of new technologies and organizational solutions?"
            >
                <Textarea
                    value={responses.screeningNewTech || ""}
                    onChange={e => onUpdate('screeningNewTech', e.target.value)}
                    placeholder="e.g. AI, Biometrics, IoT..."
                />
            </QuestionWrapper>
        </div>
    );
}

function DescriptionSection({ responses, onUpdate, baseline }: any) {
    return (
        <div className="space-y-2">
            <QuestionWrapper
                label="Nature of Processing"
                description="How will you collect, use, store and delete data? What is the source of the data? Will you be sharing data with anyone?"
                required
            >
                <Textarea
                    value={responses.descNature || baseline?.description || ""}
                    onChange={e => onUpdate('descNature', e.target.value)}
                    placeholder="Describe the data flow and life cycle..."
                    className="min-h-[120px]"
                />
            </QuestionWrapper>

            <QuestionWrapper
                label="Scope of Processing"
                description="What is the nature of the data, and does it include special category or criminal offence data? How much data will you be collecting and using? How often?"
                required
            >
                <Textarea
                    value={responses.descScope || baseline?.scope || ""}
                    onChange={e => onUpdate('descScope', e.target.value)}
                    placeholder="Specify categories, volume, frequency, and duration..."
                    className="min-h-[120px]"
                />
            </QuestionWrapper>

            <QuestionWrapper
                label="Context of Processing"
                description="What is the nature of your relationship with the individuals? How much control will they have? Would they expect you to use their data in this way?"
            >
                <Textarea
                    value={responses.descContext || ""}
                    onChange={e => onUpdate('descContext', e.target.value)}
                    placeholder="Expectations, vulnerability of data subjects, state of tech..."
                />
            </QuestionWrapper>

            <QuestionWrapper
                label="Purposes of Processing"
                description="What do you want to achieve? What are the intended outcomes for individuals? What are the benefits for you or for society as a whole?"
            >
                <Textarea
                    value={responses.descPurpose || ""}
                    onChange={e => onUpdate('descPurpose', e.target.value)}
                    placeholder="Specific objectives and benefits..."
                />
            </QuestionWrapper>
        </div>
    );
}

function NecessitySection({ responses, onUpdate }: any) {
    return (
        <div className="space-y-2">
            <QuestionWrapper
                label="Compliance with Legal Basis"
                description="What is your lawful basis for processing? How does the processing help to achieve your purpose? Is there another way to achieve the same outcome?"
                required
            >
                <Textarea
                    value={responses.necessityBasis || ""}
                    onChange={e => onUpdate('necessityBasis', e.target.value)}
                    placeholder="Lawful basis (Art. 6) and necessity argument..."
                />
            </QuestionWrapper>

            <QuestionWrapper
                label="Data Minimization and Quality"
                description="How will you ensure that you only use the minimum amount of personal data? How will you help to support data quality?"
                required
            >
                <Textarea
                    value={responses.necessityMinimization || ""}
                    onChange={e => onUpdate('necessityMinimization', e.target.value)}
                    placeholder="Steps taken to minimize data collection..."
                />
            </QuestionWrapper>

            <QuestionWrapper
                label="Transparency and Rights"
                description="How will you provide privacy information to individuals? How will you help to support their rights?"
            >
                <Textarea
                    value={responses.necessityRights || ""}
                    onChange={e => onUpdate('necessityRights', e.target.value)}
                    placeholder="Privacy notices, access requests, portability..."
                />
            </QuestionWrapper>

            <QuestionWrapper
                label="Processor Management"
                description="If you use a data processor, what are your data protection arrangements with them (contractual requirements)?"
            >
                <Textarea
                    value={responses.necessityProcessors || ""}
                    onChange={e => onUpdate('necessityProcessors', e.target.value)}
                    placeholder="DPA availability, sub-processor monitoring..."
                />
            </QuestionWrapper>
        </div>
    );
}

function RiskSection({ responses, onUpdate }: any) {
    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <p className="font-semibold">Risk Methodology</p>
                    <p className="mt-1">Describe the source of risk and the nature of potential impact on individuals, then evaluate likelihood and severity.</p>
                </div>
            </div>

            <QuestionWrapper
                label="Identification of Risks"
                description="Describe the potential for unauthorized access, data loss, identity theft, or any other impact on individuals."
                required
            >
                <Textarea
                    value={responses.riskDetails || ""}
                    onChange={e => onUpdate('riskDetails', e.target.value)}
                    placeholder="List specific risks to rights and freedoms..."
                    className="min-h-[150px]"
                />
            </QuestionWrapper>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Likelihood of Harm</Label>
                    <Select value={responses.riskLikelihood || "medium"} onValueChange={(v: string) => onUpdate('riskLikelihood', v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low (Remote)</SelectItem>
                            <SelectItem value="medium">Medium (Possible)</SelectItem>
                            <SelectItem value="high">High (Probable)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Severity of Impact</Label>
                    <Select value={responses.riskSeverity || "medium"} onValueChange={(v: string) => onUpdate('riskSeverity', v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low (Minimal impact)</SelectItem>
                            <SelectItem value="medium">Medium (Moderate harm)</SelectItem>
                            <SelectItem value="high">High (Significant harm)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded border border-dashed border-slate-200">
                <Label className="text-slate-500 uppercase text-[10px] tracking-wider mb-2 block">Inherent Risk Rating</Label>
                <div className="flex items-center gap-2">
                    <Badge className={
                        responses.riskSeverity === 'high' || responses.riskLikelihood === 'high'
                            ? "bg-red-100 text-red-600 hover:bg-red-100"
                            : "bg-blue-100 text-blue-600 hover:bg-blue-100"
                    }>
                        {responses.riskSeverity === 'high' || responses.riskLikelihood === 'high' ? 'High Risk' : 'Medium/Low Risk'}
                    </Badge>
                </div>
            </div>
        </div>
    );
}

function MitigationSection({ responses, onUpdate, baseline }: any) {
    return (
        <div className="space-y-2">
            <QuestionWrapper
                label="Mitigation Measures"
                description="What measures are in place to reduce or eliminate each of the identified risks? This includes technical (encryption) and organizational (policy) controls."
                required
            >
                <Textarea
                    value={responses.mitigationDetails || baseline?.mitigationMeasures || ""}
                    onChange={e => onUpdate('mitigationDetails', e.target.value)}
                    placeholder="Describe specific controls and safeguards..."
                    className="min-h-[150px]"
                />
            </QuestionWrapper>

            <QuestionWrapper
                label="Residual Risk Assessment"
                description="After taking the above measures, is the residual risk now acceptable? Are there any remaining high risks?"
            >
                <Textarea
                    value={responses.mitigationResidual || ""}
                    onChange={e => onUpdate('mitigationResidual', e.target.value)}
                    placeholder="Remaining impact after controls are applied..."
                />
            </QuestionWrapper>

            <QuestionWrapper
                label="DPO Consultation Needed?"
                description="Does the residual risk remain high such that you must consult the DPA (Supervisory Authority)?"
            >
                <Select value={responses.mitigationConsultation || "no"} onValueChange={(v: string) => onUpdate('mitigationConsultation', v)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="no">No - Residual risk is low/authorized</SelectItem>
                        <SelectItem value="yes">Yes - Residual risk remains high (Article 36)</SelectItem>
                    </SelectContent>
                </Select>
            </QuestionWrapper>
        </div>
    );
}

function ApprovalSection({ responses, onUpdate }: any) {
    return (
        <div className="space-y-6">
            <div className="bg-green-50 border border-green-100 p-4 rounded-lg flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                    <p className="font-semibold">Ready for Review</p>
                    <p className="mt-1">Please ensure all mandatory fields are completed before submitting for final internal sign-off.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <QuestionWrapper label="Assigned Reviewer (DPO/CISO)" required>
                    <Input
                        value={responses.approvalReviewer || ""}
                        onChange={e => onUpdate('approvalReviewer', e.target.value)}
                        placeholder="Name of the person reviewing..."
                    />
                </QuestionWrapper>
                <QuestionWrapper label="Review Target Date" required>
                    <Input
                        type="date"
                        value={responses.approvalDate || ""}
                        onChange={e => onUpdate('approvalDate', e.target.value)}
                    />
                </QuestionWrapper>
            </div>

            <QuestionWrapper label="DPO Recommendations" description="Summary of the Data Protection Officer's advice (Article 35(2)).">
                <Textarea
                    value={responses.approvalDpoAdvice || ""}
                    onChange={e => onUpdate('approvalDpoAdvice', e.target.value)}
                    placeholder="Attach or summarize DPO feedback..."
                />
            </QuestionWrapper>

            <QuestionWrapper label="Management Decision" description="Final decision from management to proceed with the processing activity.">
                <Textarea
                    value={responses.approvalDecision || ""}
                    onChange={e => onUpdate('approvalDecision', e.target.value)}
                    placeholder="Record the official board or management decision..."
                />
            </QuestionWrapper>
        </div>
    );
}


