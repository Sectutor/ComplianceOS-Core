import { useState, useEffect } from "react";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Badge } from "@complianceos/ui/ui/badge";
import { ArrowLeft, Save, Loader2, Clock, CheckCircle2, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { PageGuide } from "@/components/PageGuide";
import { cn } from "@/lib/utils";

export default function CyberIncidentDetail() {
    const { selectedClientId } = useClientContext();
    const [, setLocation] = useLocation();
    const params = useParams<{ incidentId: string }>();
    const incidentId = parseInt(params.incidentId || "0");

    // Form State
    const [title, setTitle] = useState<string>("");
    const [severity, setSeverity] = useState<string>("");
    const [cause, setCause] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [crossBorder, setCrossBorder] = useState<string>("no");
    const [status, setStatus] = useState<string>("open");
    const [affectedAssets, setAffectedAssets] = useState<string>("");
    const [reportedToAuthorities, setReportedToAuthorities] = useState<boolean>(false);

    const { data: incident, isLoading, refetch } = trpc.cyber.getIncident.useQuery(
        { clientId: selectedClientId!, incidentId },
        { enabled: !!selectedClientId && !!incidentId }
    );

    const updateMutation = trpc.cyber.updateIncident.useMutation({
        onSuccess: () => {
            toast.success("Incident Updated", {
                description: "The incident report has been saved.",
            });
            refetch();
        },
        onError: (error) => {
            toast.error("Error", {
                description: error.message || "Failed to update incident",
            });
        }
    });

    // Load incident data into form
    useEffect(() => {
        if (incident) {
            setTitle(incident.title || "");
            setSeverity(incident.severity || "low");
            setCause(incident.cause || "");
            setDescription(incident.description || "");
            setCrossBorder(incident.crossBorderImpact ? "yes" : "no");
            setStatus(incident.status || "open");
            setAffectedAssets(incident.affectedAssets || "");
            setReportedToAuthorities(incident.reportedToAuthorities || false);
        }
    }, [incident]);

    const handleSave = () => {
        if (!selectedClientId) return;

        updateMutation.mutate({
            clientId: selectedClientId,
            incidentId,
            title,
            severity: severity as "low" | "medium" | "high" | "critical",
            cause,
            description,
            crossBorderImpact: crossBorder === "yes",
            affectedAssets,
            status: status as "open" | "investigating" | "mitigated" | "resolved" | "reported",
            reportedToAuthorities
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#3ABEF9]" />
                <p className="text-sm font-bold text-slate-500">Loading incident data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
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
                        title={`Incident Analysis: ID-${incidentId}`}
                        description="Track investigative findings and manage the formal reporting lifecycle."
                        rationale="NIS2 Article 23 requires a detailed report within 72 hours of the early warning."
                        howToUse={[
                            { step: "Status", description: "Keep the incident status updated as the investigation progresses." },
                            { step: "Evidence", description: "Document all affected assets and containment actions." },
                            { step: "Report", description: "Trigger official reporting once findings are solidified." }
                        ]}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={cn(
                        "font-bold px-4 py-2 rounded-xl uppercase tracking-widest text-xs",
                        severity === 'critical' ? "bg-red-500 text-white shadow-lg shadow-red-100" :
                            severity === 'high' ? "bg-orange-500 text-white shadow-lg shadow-orange-100" :
                                "bg-[#3ABEF9] text-white shadow-lg shadow-sky-100"
                    )}>
                        {severity.toUpperCase()} PRIORITY
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden ring-1 ring-slate-200/50">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                            <CardTitle className="text-xl font-bold text-slate-900">Incident Core Information</CardTitle>
                            <CardDescription className="text-slate-500">Document the technical details and current severity standing.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">Incident Title / Summary</Label>
                                <Input
                                    className="h-12 rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20 font-bold"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700">Current Lifecycle Status</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200">
                                            <SelectItem value="open">Open - New Report</SelectItem>
                                            <SelectItem value="investigating">Investigating - Active Analysis</SelectItem>
                                            <SelectItem value="mitigated">Mitigated - Threats Contained</SelectItem>
                                            <SelectItem value="resolved">Resolved - Fully Repaired</SelectItem>
                                            <SelectItem value="reported">Reported to Authorities</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700">Priority Level</Label>
                                    <Select value={severity} onValueChange={setSeverity}>
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200">
                                            <SelectItem value="low">Low - Minimum Operational Impact</SelectItem>
                                            <SelectItem value="medium">Medium - Disruptive but Managed</SelectItem>
                                            <SelectItem value="high">High - Critical Service Interruption</SelectItem>
                                            <SelectItem value="critical">Critical - Systemic / Safety Risk</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">Suspected Root Cause</Label>
                                <Select value={cause} onValueChange={setCause}>
                                    <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200">
                                        <SelectItem value="malware">Malware / Ransomware Activity</SelectItem>
                                        <SelectItem value="phishing">Phishing / Social Engineering</SelectItem>
                                        <SelectItem value="dos">Distributed Denial of Service (DDoS)</SelectItem>
                                        <SelectItem value="vulnerability">Software Vulnerability Exploit</SelectItem>
                                        <SelectItem value="insider">Insider Threat / Error</SelectItem>
                                        <SelectItem value="unknown">Still Under Investigation</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">Detailed Description</Label>
                                <Textarea
                                    className="min-h-[150px] rounded-xl border-slate-200 p-4 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-8 flex justify-between">
                            <Button
                                variant="outline"
                                onClick={() => setLocation(`/clients/${selectedClientId}/cyber/incidents`)}
                                className="h-12 px-8 rounded-xl font-bold border-slate-200 hover:bg-slate-100"
                            >
                                Discard Changes
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={updateMutation.isLoading}
                                className="bg-[#3ABEF9] hover:bg-[#1C4D8D] text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-sky-100 transition-all active:scale-95"
                            >
                                {updateMutation.isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Save Incident Analysis
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Sidebar Context */}
                <div className="space-y-8">
                    {/* Compliance Reporting */}
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden ring-1 ring-slate-200/50">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Send className="h-5 w-5 text-[#3ABEF9]" />
                                Regulatory Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="p-4 bg-[#1C4D8D]/5 rounded-2xl border border-[#1C4D8D]/10">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase">CSIRT Notification</span>
                                    <Badge variant="outline" className={cn(
                                        "border-none font-bold px-2 py-0.5 rounded-full text-[10px]",
                                        reportedToAuthorities ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                                    )}>
                                        {reportedToAuthorities ? "COMPLETED" : "PENDING"}
                                    </Badge>
                                </div>
                                <p className="text-sm font-bold text-slate-900">
                                    {reportedToAuthorities ? "Reported to national CSIRT" : "Not yet reported to CSIRT"}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-sm font-bold text-slate-700">Cross-border Significance</Label>
                                <Select value={crossBorder} onValueChange={setCrossBorder}>
                                    <SelectTrigger className="h-10 rounded-xl border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200">
                                        <SelectItem value="no">Single Member State Only</SelectItem>
                                        <SelectItem value="yes">EU Cross-border Impact</SelectItem>
                                        <SelectItem value="unknown">Impact Unknown</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Affected Assets */}
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden ring-1 ring-slate-200/50">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-[#3ABEF9]" />
                                Affected Systems
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Textarea
                                className="min-h-[120px] rounded-xl border-slate-200 focus:border-[#3ABEF9] focus:ring-[#3ABEF9]/20"
                                value={affectedAssets}
                                onChange={(e) => setAffectedAssets(e.target.value)}
                                placeholder="List systems, databases, or cloud services affected..."
                            />
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-[#1C4D8D] overflow-hidden text-white">
                        <CardHeader className="border-b border-white/10 p-6">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Event Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-1">
                                <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Detection Date</div>
                                <div className="text-sm font-medium">{incident?.detectedAt && format(new Date(incident.detectedAt), "PPP p")}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Initial Report</div>
                                <div className="text-sm font-medium">{incident?.createdAt && format(new Date(incident.createdAt), "PPP p")}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Last Modified</div>
                                <div className="text-sm font-medium">{incident?.updatedAt && format(new Date(incident.updatedAt), "PPP p")}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
