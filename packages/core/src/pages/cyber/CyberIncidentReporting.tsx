import { useState } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Progress } from "@complianceos/ui/ui/progress";
import { Badge } from "@complianceos/ui/ui/badge";
import { Switch } from "@complianceos/ui/ui/switch";
import { AlertTriangle, ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { PageGuide } from "@/components/PageGuide";
import { cn } from "@/lib/utils";

type Severity = "low" | "medium" | "high" | "critical";

interface IncidentFormData {
    detectedAt: string;
    severity: Severity;
    cause: string;
    description: string;
    crossBorderImpact: boolean;
    affectedAssets?: string;
    title?: string;
}

export default function CyberIncidentReporting() {
    const [step, setStep] = useState(0);
    const { selectedClientId } = useClientContext();
    const [, setLocation] = useLocation();

    const [formData, setFormData] = useState<IncidentFormData>({
        detectedAt: new Date().toISOString().slice(0, 16),
        severity: "medium",
        cause: "",
        description: "",
        crossBorderImpact: false,
        affectedAssets: ""
    });

    const reportMutation = trpc.cyber.reportIncident.useMutation({
        onSuccess: () => {
            toast.success("Incident Reported", {
                description: "The official notification has been logged for compliance.",
            });
            setLocation(`/clients/${selectedClientId}/cyber/incidents`);
        },
        onError: (error) => {
            toast.error("Error", {
                description: error.message || "Failed to submit report",
            });
        }
    });

    const handleSubmit = () => {
        if (!selectedClientId) {
            toast.error("Error", { description: "No client selected" });
            return;
        }
        if (!formData.severity || !formData.description) {
            toast.error("Validation Error", { description: "Please fill in all required fields" });
            return;
        }

        reportMutation.mutate({
            clientId: selectedClientId,
            detectedAt: new Date(formData.detectedAt).toISOString(),
            severity: formData.severity,
            cause: formData.cause || "Unknown",
            description: formData.description,
            crossBorderImpact: formData.crossBorderImpact,
            affectedAssets: formData.affectedAssets,
            title: `Incident: ${formData.cause || 'Manual Report'} (${new Date().toLocaleDateString()})`
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLocation(`/clients/${selectedClientId}/cyber/incidents`)}
                    className="mt-1 h-10 w-10 rounded-xl hover:bg-white shadow-sm ring-1 ring-slate-200/50"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <PageGuide
                    title="Report Cyber Incident"
                    description="Mandatory 24h/72h reporting wizard for NIS2 compliance."
                    rationale="Article 23 requires entities to notify the CSIRT or competent authority of significant incidents without undue delay."
                    howToUse={[
                        { step: "Details", description: "Provide the basic 'who, what, when' of the incident." },
                        { step: "Impact", description: "Assess severity and cross-border significance." },
                        { step: "Submit", description: "Review and file the report for immediate attention." }
                    ]}
                />
            </div>

            {/* Progress Bar */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                <div className="flex justify-between mb-4">
                    {['Incident Details', 'Impact Assessment', 'Review & Submit'].map((label, i) => (
                        <div key={label} className="flex flex-col items-center gap-2">
                            <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all duration-300",
                                step >= i ? "bg-[#3ABEF9] text-white shadow-lg shadow-sky-100" : "bg-slate-100 text-slate-400"
                            )}>
                                {i + 1}
                            </div>
                            <span className={cn(
                                "text-xs font-bold uppercase tracking-wider",
                                step >= i ? "text-[#1C4D8D]" : "text-slate-400"
                            )}>{label}</span>
                        </div>
                    ))}
                </div>
                <Progress value={(step / 2) * 100} className="h-2 rounded-full bg-slate-100" />
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden ring-1 ring-slate-200/50">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                    <CardTitle className="text-2xl font-bold text-slate-900">
                        {step === 0 ? "Step 1: Incident Context" :
                            step === 1 ? "Step 2: Impact Analysis" :
                                "Step 3: Verification"}
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-lg">
                        {step === 0 ? "When was it detected and what is the nature of the event?" :
                            step === 1 ? "Assess the scale and cross-border implications." :
                                "Final review before alerting the authorities."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    {step === 0 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700">Detailed at (UTC)</Label>
                                    <Input
                                        type="datetime-local"
                                        className="h-12 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                                        value={formData.detectedAt}
                                        onChange={(e) => setFormData({ ...formData, detectedAt: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700">Initial Severity Estimate</Label>
                                    <Select
                                        value={formData.severity}
                                        onValueChange={(val: any) => setFormData({ ...formData, severity: val })}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200">
                                            <SelectItem value="low">Low - Minimum Impact</SelectItem>
                                            <SelectItem value="medium">Medium - Normal Operations Impacted</SelectItem>
                                            <SelectItem value="high">High - Critical Systems Disrupted</SelectItem>
                                            <SelectItem value="critical">Critical - Business Halt / Data Breach</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">Incident Description</Label>
                                <Textarea
                                    placeholder="Briefly describe the nature of the incident..."
                                    className="min-h-[150px] rounded-xl border-slate-200 p-4 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">Root Cause (if known)</Label>
                                <Input
                                    placeholder="e.g., Phishing, Zero-day exploit, Hardware failure"
                                    className="h-12 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                                    value={formData.cause}
                                    onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                                />
                            </div>
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-base font-bold text-slate-900">Cross-border Impact</Label>
                                        <p className="text-sm text-slate-500">Does this incident affect entities in other EU member states?</p>
                                    </div>
                                    <Switch
                                        checked={formData.crossBorderImpact}
                                        onCheckedChange={(val) => setFormData({ ...formData, crossBorderImpact: val })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">Affected Assets</Label>
                                <Input
                                    placeholder="e.g., Production DB, ERP System, Remote Access Portal"
                                    className="h-12 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                                    value={formData.affectedAssets || ""}
                                    onChange={(e) => setFormData({ ...formData, affectedAssets: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="bg-[#1C4D8D]/5 p-8 rounded-2xl border border-[#1C4D8D]/10">
                                <h3 className="text-lg font-bold text-[#1C4D8D] mb-6 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Reporting Summary
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <div className="text-xs font-bold text-slate-400 uppercase">Detection Time</div>
                                        <div className="font-bold text-slate-900">{new Date(formData.detectedAt).toLocaleString()}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs font-bold text-slate-400 uppercase">Severity</div>
                                        <div>
                                            <Badge className={cn(
                                                "font-bold px-3 py-1",
                                                formData.severity === 'critical' ? "bg-red-500 text-white" :
                                                    formData.severity === 'high' ? "bg-orange-500 text-white" : "bg-[#3ABEF9] text-white"
                                            )}>{formData.severity.toUpperCase()}</Badge>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-1 pt-4 border-t border-slate-100">
                                        <div className="text-xs font-bold text-slate-400 uppercase">Description</div>
                                        <div className="text-slate-700 leading-relaxed">{formData.description}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-6 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800">
                                <ShieldAlert className="h-6 w-6 flex-shrink-0" />
                                <p className="text-sm font-medium">
                                    By clicking 'Submit Formal Report', you are formally notifying the incident response team.
                                    This action will be logged for NIS2 compliance auditing.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-8 flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => step > 0 && setStep(step - 1)}
                        disabled={step === 0}
                        className="h-12 px-8 rounded-xl font-bold border-slate-200 hover:bg-slate-100"
                    >
                        Previous
                    </Button>
                    <Button
                        onClick={() => step < 2 ? setStep(step + 1) : handleSubmit()}
                        disabled={reportMutation.isLoading}
                        className="bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-sky-100 transition-all active:scale-95"
                    >
                        {reportMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {step === 2 ? 'Submit Formal Report' : 'Continue'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
