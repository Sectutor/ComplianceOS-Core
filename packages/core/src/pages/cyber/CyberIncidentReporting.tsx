import { useState } from "react";
import CyberLayout from "./CyberLayout";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@complianceos/ui/ui/alert";
import { Clock, AlertTriangle, Send, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { PageGuide } from "@/components/PageGuide";

export default function CyberIncidentReporting() {
    const [step, setStep] = useState(1);
    const { selectedClientId } = useClientContext();
    const [location, setLocation] = useLocation();

    // ...

    // Form State
    const [detectedAt, setDetectedAt] = useState<string>(new Date().toISOString().slice(0, 16));
    const [severity, setSeverity] = useState<string>("");
    const [cause, setCause] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [crossBorder, setCrossBorder] = useState<string>("no");

    const reportMutation = trpc.cyber.reportIncident.useMutation({
        onSuccess: () => {
            toast.success("Incident Reported", {
                description: "The CSIRT has been notified. You can update this report later.",
            });
            // Redirect to dashboard or list
            setLocation(`/cyber`);
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
        if (!severity || !cause || !description) {
            toast.error("Validation Error", { description: "Please fill in all required fields" });
            return;
        }

        reportMutation.mutate({
            clientId: selectedClientId,
            detectedAt: new Date(detectedAt).toISOString(),
            severity: severity as "low" | "medium" | "high" | "critical",
            cause,
            description,
            crossBorderImpact: crossBorder === "yes",
            title: `Incident: ${cause} (${new Date().toLocaleDateString()})`
        });
    };


    return (
        <CyberLayout>
            <div className="space-y-6">
                <div className="flex items-start gap-4 animate-slide-down">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/cyber/incidents")} className="mt-1">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <PageGuide
                        title="Report New Incident"
                        description="Step-by-step wizard for reporting significant incidents."
                        rationale="NIS2 mandates strict reporting timelines (24h/72h) for significant incidents."
                        howToUse={[
                            { step: "24h Warning", description: " Submit early warning within 24 hours of detection." },
                            { step: "72h Details", description: "Provide detailed assessment within 72 hours." },
                            { step: "Final Report", description: "Submit full analysis within 1 month." }
                        ]}
                    />
                </div>

                <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertTitle>Early Warning Required</AlertTitle>
                    <AlertDescription>
                        Significant incidents must be reported to the CSIRT within <strong>24 hours</strong> of becoming aware of the incident.
                    </AlertDescription>
                </Alert>

                <div className="flex gap-4 mb-8">
                    {['Initial Report (24h)', 'Detailed Notification (72h)', 'Intermediate Report', 'Final Report (1 Month)'].map((s, i) => (
                        <div
                            key={i}
                            onClick={() => setStep(i + 1)}
                            className={`flex-1 border-b-2 pb-2 text-sm font-medium cursor-pointer transition-colors ${step === i + 1 ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-slate-700'}`}
                        >
                            {i + 1}. {s}
                        </div>
                    ))}
                </div>

                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Submit Early Warning Report</CardTitle>
                            <CardDescription>
                                This report is strictly for the CSIRT to assess if the incident is ongoing and significant.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Date & Time Detected</Label>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="datetime-local"
                                            value={detectedAt}
                                            onChange={(e) => setDetectedAt(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Severity Level</Label>
                                    <Select value={severity} onValueChange={setSeverity}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select severity" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low - No Service Disruption</SelectItem>
                                            <SelectItem value="medium">Medium - Limited Disruption</SelectItem>
                                            <SelectItem value="high">High - Significant Disruption/Data Loss</SelectItem>
                                            <SelectItem value="critical">Critical - Public Safety/Systemic Risk</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Suspected Cause</Label>
                                <Select value={cause} onValueChange={setCause}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select cause" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="malware">Malware / Ransomware</SelectItem>
                                        <SelectItem value="phishing">Phishing / Social Engineering</SelectItem>
                                        <SelectItem value="dos">DDoS</SelectItem>
                                        <SelectItem value="vulnerability">Exploited Vulnerability</SelectItem>
                                        <SelectItem value="insider">Insider Threat</SelectItem>
                                        <SelectItem value="unknown">Unknown</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Brief Description of Incident</Label>
                                <Textarea
                                    placeholder="Describe what happened, systems affected, and current status..."
                                    className="h-32"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Cross-border Impact?</Label>
                                <Select value={crossBorder} onValueChange={setCrossBorder}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Does this affect other EU member states?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no">No</SelectItem>
                                        <SelectItem value="yes">Yes</SelectItem>
                                        <SelectItem value="unknown">Unknown</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="ghost">Save Draft</Button>
                            <Button
                                className="bg-red-600 hover:bg-red-700"
                                onClick={handleSubmit}
                                disabled={reportMutation.isLoading}
                            >
                                {reportMutation.isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                Submit Report
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {step === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Notification (72h)</CardTitle>
                            <CardDescription>
                                A comprehensive assessment of the incident, including indicators of compromise (IoCs) and root cause analysis.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Initial Mitigation Steps Taken</Label>
                                <Textarea placeholder="Describe actions taken to contain the incident..." className="h-24" />
                            </div>
                            <div className="space-y-2">
                                <Label>Indicators of Compromise (IoCs)</Label>
                                <Textarea placeholder="IP addresses, file hashes, domains, etc." className="h-24 font-mono text-xs" />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={() => setStep(3)}>Next: Intermediate Report</Button>
                        </CardFooter>
                    </Card>
                )}

                {step === 3 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Intermediate Report</CardTitle>
                            <CardDescription>
                                Updates on the status of the incident if it is not yet resolved.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <AlertTitle>Report Status</AlertTitle>
                                <AlertDescription>Required only if the incident is ongoing beyond 72 hours.</AlertDescription>
                            </Alert>
                            <div className="space-y-2">
                                <Label>Current Status Update</Label>
                                <Textarea placeholder="What has changed since the last report?" className="h-32" />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                            <Button onClick={() => setStep(4)}>Next: Final Report</Button>
                        </CardFooter>
                    </Card>
                )}

                {step === 4 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Final Report (1 Month)</CardTitle>
                            <CardDescription>
                                A complete report on the incident, including its root cause, applied mitigation measures, and cross-border impact.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Root Cause Analysis (Final)</Label>
                                <Textarea placeholder="Detailed explanation of how the incident occurred..." className="h-24" />
                            </div>
                            <div className="space-y-2">
                                <Label>Lessons Learned</Label>
                                <Textarea placeholder="What improvements will be made to prevent recurrence?" className="h-24" />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                            <Button className="bg-green-600 hover:bg-green-700">Close Incident</Button>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </CyberLayout>
    );
}
