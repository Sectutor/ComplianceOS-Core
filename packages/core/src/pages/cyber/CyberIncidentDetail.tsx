import { useState, useEffect } from "react";
import CyberLayout from "./CyberLayout";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@complianceos/ui/ui/alert";
import { Badge } from "@complianceos/ui/ui/badge";
import { ArrowLeft, Save, Loader2, Clock, CheckCircle2, FileText, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";

export default function CyberIncidentDetail() {
    const { selectedClientId } = useClientContext();
    const [location, setLocation] = useLocation();
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

    const getSeverityColor = (sev: string) => {
        switch (sev) {
            case "critical": return "bg-red-100 text-red-800 border-red-200";
            case "high": return "bg-orange-100 text-orange-800 border-orange-200";
            case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            default: return "bg-green-100 text-green-800 border-green-200";
        }
    };

    if (isLoading) {
        return (
            <CyberLayout>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </CyberLayout>
        );
    }

    return (
        <CyberLayout>
            <div className="space-y-6 w-full max-w-4xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setLocation("/cyber/incidents")}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Incident #{incidentId}</h1>
                            <p className="text-muted-foreground text-sm">
                                {incident?.createdAt && `Reported ${format(new Date(incident.createdAt), "MMMM d, yyyy 'at' HH:mm")}`}
                            </p>
                        </div>
                    </div>
                    <Badge className={`text-sm px-3 py-1 ${getSeverityColor(severity)}`}>
                        {severity.toUpperCase()}
                    </Badge>
                </div>

                {/* Status Timeline */}
                <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={status === "resolved" ? "default" : "secondary"} className="capitalize">
                        {status.replace("_", " ")}
                    </Badge>
                    {reportedToAuthorities && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Send className="h-3 w-3 mr-1" /> Reported to CSIRT
                        </Badge>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Incident Details</CardTitle>
                        <CardDescription>Edit and update the incident report. Changes are preserved as evidence.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Severity Level</Label>
                                <Select value={severity} onValueChange={setSeverity}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low - No Service Disruption</SelectItem>
                                        <SelectItem value="medium">Medium - Limited Disruption</SelectItem>
                                        <SelectItem value="high">High - Significant Disruption</SelectItem>
                                        <SelectItem value="critical">Critical - Public Safety Risk</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Current Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="investigating">Investigating</SelectItem>
                                        <SelectItem value="mitigated">Mitigated</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="reported">Reported to Authority</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Suspected Cause</Label>
                            <Select value={cause} onValueChange={setCause}>
                                <SelectTrigger>
                                    <SelectValue />
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
                            <Label>Description</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Detailed description of the incident..."
                                className="h-32"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Affected Assets</Label>
                            <Textarea
                                value={affectedAssets}
                                onChange={(e) => setAffectedAssets(e.target.value)}
                                placeholder="List of affected systems, servers, or data..."
                                className="h-20"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Cross-border Impact?</Label>
                                <Select value={crossBorder} onValueChange={setCrossBorder}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no">No</SelectItem>
                                        <SelectItem value="yes">Yes</SelectItem>
                                        <SelectItem value="unknown">Unknown</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Reported to Authorities?</Label>
                                <Select
                                    value={reportedToAuthorities ? "yes" : "no"}
                                    onValueChange={(v) => setReportedToAuthorities(v === "yes")}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no">No</SelectItem>
                                        <SelectItem value="yes">Yes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" onClick={() => setLocation("/cyber/incidents")}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={updateMutation.isLoading}>
                            {updateMutation.isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Save Changes
                        </Button>
                    </CardFooter>
                </Card>

                {/* Evidence & Audit Trail */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Evidence & Audit Trail
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle>Evidentiary Record</AlertTitle>
                            <AlertDescription>
                                All changes to this incident are automatically logged with timestamps.
                                This record can be exported for management reporting or regulatory submissions.
                            </AlertDescription>
                        </Alert>
                        <div className="mt-4 text-sm text-muted-foreground">
                            <p><strong>Created:</strong> {incident?.createdAt && format(new Date(incident.createdAt), "PPpp")}</p>
                            <p><strong>Last Modified:</strong> {incident?.updatedAt && format(new Date(incident.updatedAt), "PPpp")}</p>
                            <p><strong>Reporter:</strong> {incident?.reporterName || "Unknown"}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </CyberLayout>
    );
}
