
import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Shield, ArrowLeft, Save, CheckCircle, AlertTriangle, Globe, Lock, Scale, Info } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";

const STEPS = [
    { id: 'mapping', title: '1. Transfer Mapping', icon: Globe },
    { id: 'safeguards', title: '2. Legal Safeguards', icon: Shield },
    { id: 'country', title: '3. Local Law Assessment', icon: Scale },
    { id: 'measures', title: '4. Supplementary Measures', icon: Lock },
    { id: 'conclusion', title: '5. Conclusion & Risk', icon: CheckCircle }
];

export default function TIAWorkspace() {
    const { id, transferId } = useParams<{ id: string, transferId: string }>();
    const [location, setLocation] = useLocation();
    const clientId = parseInt(id || "0");
    const tId = parseInt(transferId || "0");
    const [activeStep, setActiveStep] = useState(0);

    const { data: transfer, isLoading } = trpc.transfers.get.useQuery({ id: tId });
    const { data: adequacy } = trpc.transfers.getAdequacy.useQuery(
        { countryCode: transfer?.destinationCountry || "" },
        { enabled: !!transfer?.destinationCountry }
    );

    const [responses, setResponses] = useState<any>({});
    const [riskLevel, setRiskLevel] = useState("low");

    const saveMutation = trpc.transfers.saveTIA.useMutation({
        onSuccess: () => toast.success("Assessment saved"),
        onError: (err) => toast.error(`Save failed: ${err.message}`)
    });

    useEffect(() => {
        if (transfer?.latestTia) {
            setResponses(transfer.latestTia.questionnaireData || {});
            setRiskLevel(transfer.latestTia.riskLevel || "low");
        }
    }, [transfer]);

    const handleUpdateResponse = (field: string, value: any) => {
        setResponses(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = (status = "draft") => {
        saveMutation.mutate({
            transferId: tId,
            clientId,
            responses,
            riskLevel,
            status
        });
    };

    if (isLoading) return <div className="p-10 text-center">Loading Transfer Details...</div>;
    if (!transfer) return <div className="p-10 text-center text-red-500">Transfer not found.</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className="bg-white border-b p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => setLocation(`/clients/${clientId}/privacy/transfers`)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center">
                            TIA: {transfer.title}
                            <Badge variant="outline" className="ml-3 font-mono uppercase bg-slate-50">
                                {transfer.destinationCountry}
                            </Badge>
                        </h1>
                        <p className="text-sm text-muted-foreground">Transfer Impact Assessment (EDPB 6-Step process)</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleSave("draft")}>
                        <Save className="w-4 h-4 mr-2" /> Save Draft
                    </Button>
                    <Button onClick={() => handleSave("completed")} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 mr-2" /> Complete Assessment
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-72 border-r bg-slate-50 p-4 shrink-0 overflow-y-auto">
                    <div className="space-y-1">
                        {STEPS.map((step, idx) => (
                            <button
                                key={step.id}
                                onClick={() => setActiveStep(idx)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeStep === idx
                                        ? 'bg-white shadow-sm text-blue-600 border'
                                        : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                <step.icon className={`w-4 h-4 ${activeStep === idx ? 'text-blue-600' : 'text-slate-400'}`} />
                                {step.title}
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                        <h3 className="text-xs font-bold text-yellow-800 uppercase flex items-center mb-2">
                            <Info className="w-3 h-3 mr-1" /> Adequacy Info
                        </h3>
                        {adequacy ? (
                            <div className="text-xs text-yellow-800 leading-relaxed">
                                <p className="font-bold">{transfer.destinationCountry} is ADEQUATE.</p>
                                <p className="mt-1 opacity-80">{adequacy.scope}</p>
                            </div>
                        ) : (
                            <div className="text-xs text-yellow-800 leading-relaxed">
                                <p className="font-bold">Not Adequate.</p>
                                <p className="mt-1 opacity-80">Full TIA and supplementary measures required under Art. 46.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-slate-100 p-8">
                    <Card className="max-w-4xl mx-auto shadow-sm">
                        <CardHeader>
                            <CardTitle>{STEPS[activeStep].title}</CardTitle>
                            <CardDescription>
                                {activeStep === 0 && "Describe the details of the data flow and the parties involved."}
                                {activeStep === 1 && "Identify the legal instrument relied upon for the transfer."}
                                {activeStep === 2 && "Assess whether the laws in the destination country provide an essentially equivalent level of protection."}
                                {activeStep === 3 && "Identify and implement any necessary supplementary measures (Technical, Organizational, Contractual)."}
                                {activeStep === 4 && "Final summary and risk determination for this transfer."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* STEP 1: MAPPING */}
                            {activeStep === 0 && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Data Exporter (Entity Name)</Label>
                                            <Input
                                                value={responses.exporterName || ""}
                                                onChange={e => handleUpdateResponse("exporterName", e.target.value)}
                                                placeholder="e.g. Acme Corp EU"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Data Importer (Entity Name)</Label>
                                            <Input
                                                value={responses.importerName || ""}
                                                onChange={e => handleUpdateResponse("importerName", e.target.value)}
                                                placeholder="e.g. AWS Inc. (US)"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description of Data Transferred</Label>
                                        <Textarea
                                            value={responses.dataDescription || ""}
                                            onChange={e => handleUpdateResponse("dataDescription", e.target.value)}
                                            placeholder="Identify categories of data subjects and types of personal data (e.g., customer names, emails, billing info)..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Purpose of Transfer</Label>
                                        <Textarea
                                            value={responses.transferPurpose || ""}
                                            onChange={e => handleUpdateResponse("transferPurpose", e.target.value)}
                                            placeholder="e.g. Provision of cloud storage services, Technical Support, etc."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: SAFEGUARDS */}
                            {activeStep === 1 && (
                                <div className="space-y-6">
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                                        <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold text-blue-800">Transfer Tool: {transfer.transferTool.replace('_', ' ').toUpperCase()}</p>
                                            <p className="text-xs text-blue-700 mt-1">This tool was defined during the transfer setup. Confirm if it remains appropriate for the current flow.</p>
                                        </div>
                                    </div>

                                    {transfer.transferTool === 'scc_2021' && (
                                        <Card className="border-dashed border-2">
                                            <CardContent className="p-4 space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-blue-700 font-bold">Selected Module: {transfer.sccModule?.toUpperCase() || "None"}</Label>
                                                    <div className="text-xs text-muted-foreground">
                                                        {transfer.sccModule === 'c2c' && "Controller-to-Controller: Exporter and Importer are both controllers."}
                                                        {transfer.sccModule === 'c2p' && "Controller-to-Processor: Exporter is a controller, Importer is their processor."}
                                                        {transfer.sccModule === 'p2p' && "Processor-to-Processor: Exporter is a processor, Importer is a sub-processor."}
                                                        {transfer.sccModule === 'p2c' && "Processor-to-Controller: Exporter is processor, Importer is its controller (Return Flow)."}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Are supplementary clauses included? (e.g. UK Addendum)</Label>
                                                    <Input
                                                        value={responses.supplementaryClauses || ""}
                                                        onChange={e => handleUpdateResponse("supplementaryClauses", e.target.value)}
                                                        placeholder="e.g. UK IDTA Addendum attached"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <div className="space-y-2">
                                        <Label>Formal Contractual Basis</Label>
                                        <Textarea
                                            value={responses.contractualBasis || ""}
                                            onChange={e => handleUpdateResponse("contractualBasis", e.target.value)}
                                            placeholder="Detail the agreement name, date, and sections covering Chapter V compliance..."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: COUNTRY LAWS */}
                            {activeStep === 2 && (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="font-bold flex items-center gap-2">
                                            <Scale className="w-4 h-4 text-slate-500" />
                                            Third Country Legal Analysis
                                        </h3>
                                        <div className="space-y-2">
                                            <Label>Government Surveillance Laws</Label>
                                            <Description text="State whether local laws allow government bodies broad access to personal data (e.g. US FISA 702, Executive Order 12333)." />
                                            <Textarea
                                                value={responses.surveillanceLaws || ""}
                                                onChange={e => handleUpdateResponse("surveillanceLaws", e.target.value)}
                                                placeholder="Describe the legal landscape regarding government access..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Independent Oversight & Remedies</Label>
                                            <Description text="Is there an independent authority (like an ombudsperson) or judicial remedy for data subjects?" />
                                            <Textarea
                                                value={responses.legalRemedies || ""}
                                                onChange={e => handleUpdateResponse("legalRemedies", e.target.value)}
                                                placeholder="Detail the availability of legal redress for EEA individuals..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: MEASURES */}
                            {activeStep === 3 && (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Lock className="w-3 h-3 text-blue-500" />
                                                Technical Measures (Encryption)
                                            </Label>
                                            <Textarea
                                                value={responses.technicalMeasures || ""}
                                                onChange={e => handleUpdateResponse("technicalMeasures", e.target.value)}
                                                placeholder="e.g. Data encrypted in transit via TLS 1.3 and at rest via AES-256 where keys are held by the exporter..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Organizational Measures</Label>
                                            <Textarea
                                                value={responses.organizationalMeasures || ""}
                                                onChange={e => handleUpdateResponse("organizationalMeasures", e.target.value)}
                                                placeholder="e.g. Access restricted on need-to-know basis, internal policy for handling government data requests..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Contractual Measures</Label>
                                            <Textarea
                                                value={responses.additionalContractualMeasures || ""}
                                                onChange={e => handleUpdateResponse("additionalContractualMeasures", e.target.value)}
                                                placeholder="e.g. Commitment to challenge unlawful access requests, transparency reporting..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 5: CONCLUSION */}
                            {activeStep === 4 && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-50 border rounded-xl space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-lg">Overall Risk Rating</h3>
                                                <p className="text-sm text-muted-foreground">Based on the factors assessed above</p>
                                            </div>
                                            <Select value={riskLevel} onValueChange={setRiskLevel}>
                                                <SelectTrigger className="w-40 capitalize">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Low Risk</SelectItem>
                                                    <SelectItem value="medium">Medium Risk</SelectItem>
                                                    <SelectItem value="high">High Risk</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="pt-4 border-t">
                                            <Label>Final Justification / Conclusion</Label>
                                            <Textarea
                                                className="mt-2 min-h-[120px]"
                                                value={responses.finalConclusion || ""}
                                                onChange={e => handleUpdateResponse("finalConclusion", e.target.value)}
                                                placeholder="Summarize why this transfer is considered compliant..."
                                            />
                                        </div>
                                    </div>

                                    {riskLevel === 'high' && (
                                        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex gap-3 text-sm border border-red-100">
                                            <AlertTriangle className="w-5 h-5 shrink-0" />
                                            <div>
                                                <p className="font-bold uppercase tracking-tight">Warning: High Risk Transfer</p>
                                                <p>Assessments resulting in high residual risk must be flagged, and local DPA consultation might be required if supplementary measures are not effective.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </CardContent>
                        <CardFooter className="bg-slate-50 flex justify-between p-4 rounded-b-lg border-t">
                            <Button
                                variant="outline"
                                disabled={activeStep === 0}
                                onClick={() => setActiveStep(prev => prev - 1)}
                            >
                                Previous Step
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="ghost" className="text-xs text-muted-foreground" onClick={() => handleSave("draft")}>
                                    Save Progress
                                </Button>
                                <Button
                                    className="px-8"
                                    disabled={activeStep === STEPS.length - 1}
                                    onClick={() => setActiveStep(prev => prev + 1)}
                                >
                                    Next Step
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function Description({ text }: { text: string }) {
    return <p className="text-xs text-muted-foreground italic mb-1">{text}</p>;
}

function CardFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={`flex items-center p-6 pt-0 ${className}`} {...props}>{children}</div>;
}
