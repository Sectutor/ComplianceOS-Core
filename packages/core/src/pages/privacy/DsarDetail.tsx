
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { Separator } from "@complianceos/ui/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Checkbox } from "@complianceos/ui/ui/checkbox";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    User,
    Shield,
    FileText,
    History,
    AlertCircle,
    Download,
    Mail,
    Calendar,
    Zap,
    Briefcase,
    Activity,
    Info,
    CheckCircle
} from "lucide-react";

export default function DsarDetail() {
    const params = useParams();
    const clientId = parseInt((params as any)?.id || "0");
    const dsarId = (params as any)?.dsarId;
    const id = parseInt(dsarId);
    const [, setLocation] = useLocation();

    const { data: request, isLoading } = trpc.privacy.getDsarRequest.useQuery(
        { id, clientId },
        { enabled: !!id && !!clientId }
    );

    const updateStatusMutation = trpc.privacy.updateDsarStatus.useMutation({
        onSuccess: () => {
            toast.success("Status updated successfully");
        },
        onError: (err) => {
            toast.error("Failed to update status: " + err.message);
        }
    });

    const [activeTab, setActiveTab] = useState("overview");

    if (isLoading) return (
        <div className="flex items-center justify-center h-[calc(100vh-200px)] animate-fade-in">
            <div className="animate-pulse flex flex-col items-center gap-6">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin shadow-inner"></div>
                <div className="space-y-2 text-center pointer-events-none">
                    <p className="text-xl font-bold text-foreground">Loading Request Details</p>
                    <p className="text-sm text-muted-foreground animate-shimmer">Accessing secure privacy database...</p>
                </div>
            </div>
        </div>
    );

    if (!request) return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] space-y-6 animate-fade-in px-4">
            <div className="bg-destructive/10 p-4 rounded-2xl ring-1 ring-destructive/20 shadow-sm">
                <AlertCircle className="h-12 w-12 text-destructive animate-pulse" />
            </div>
            <div className="text-center space-y-2 max-w-md">
                <h2 className="text-2xl font-bold tracking-tight">Request not found</h2>
                <p className="text-muted-foreground">The Data Subject Access Request you are looking for does not exist or has been removed from the system.</p>
            </div>
            <Button
                variant="outline"
                size="lg"
                className="rounded-xl shadow-sm hover:translate-y-[-1px] transition-transform active:translate-y-0"
                onClick={() => setLocation(`/clients/${clientId}/privacy/dsar`)}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to DSAR Manager
            </Button>
        </div>
    );

    return (
        <div className="w-full max-w-full p-6 space-y-6 flex flex-col h-full animate-fade-in overflow-hidden">
            <Breadcrumb
                items={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Privacy", href: `/clients/${clientId}/privacy` },
                    { label: "DSAR Manager", href: `/clients/${clientId}/privacy/dsar` },
                    { label: request.requestId },
                ]}
            />

            {/* Premium Header */}
            <div className="flex items-center justify-between bg-card p-6 rounded-xl border shadow-sm animate-slide-down">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-muted transition-all duration-300 active:scale-95 group"
                        onClick={() => setLocation(`/clients/${clientId}/privacy/dsar`)}
                    >
                        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                    </Button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                {request.requestType} Request
                            </h1>
                            <Badge className={cn(
                                "capitalize px-3 py-1 font-semibold rounded-full shadow-sm",
                                request.status === 'Completed' ? "status-implemented text-white bg-green-600 hover:bg-green-700" :
                                    request.status === 'In Progress' ? "status-in-progress" :
                                        "status-not-implemented"
                            )}>
                                {request.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs border border-border/50">{request.requestId}</span>
                            <span className="text-muted-foreground/30">•</span>
                            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Received {new Date(request.requestDate!).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="shadow-none border-border/50 hover:bg-secondary/50 rounded-xl px-5 h-10">
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                    </Button>
                    <Button
                        className={cn(
                            "shadow-lg transition-all duration-300 font-semibold rounded-xl px-5 h-10",
                            request.status === 'Completed' ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground hover:shadow-primary/20"
                        )}
                        onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'Completed' })}
                        disabled={request.status === 'Completed' || updateStatusMutation.isPending}
                    >
                        {request.status === 'Completed' ? (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Completed
                            </>
                        ) : updateStatusMutation.isPending ? "Updating..." : "Mark as Completed"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Enhanced Sidebar */}
                <div className="col-span-3 space-y-6 animate-slide-right flex flex-col">
                    <Card className="card-top-border border-info transition-all duration-500 hover:shadow-md h-fit">
                        <CardHeader className="pb-3 px-5">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <User className="h-4 w-4 text-info" />
                                Requester Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 px-5 pb-6">
                            <div className="flex items-center gap-3 bg-secondary/30 p-4 rounded-xl border border-border/40 group transition-colors hover:bg-secondary/50">
                                <div className="h-12 w-12 rounded-2xl bg-info/10 flex items-center justify-center ring-1 ring-info/20 shadow-sm transition-transform group-hover:scale-105">
                                    <User className="h-6 w-6 text-info" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm tracking-tight truncate">{request.subjectName || 'Unknown Requester'}</p>
                                    <p className="text-xs text-muted-foreground truncate opacity-80 flex items-center gap-1"><Mail className="h-3 w-3" /> {request.subjectEmail}</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/70 decoration-info underline-offset-4 underline">Verification status</Label>
                                    <div className={cn(
                                        "flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border transition-all shadow-sm",
                                        request.verificationStatus === 'Verified' ? "status-implemented border-emerald-500/20" : "status-warning border-amber-500/20"
                                    )}>
                                        <div className="flex items-center gap-2">
                                            <Shield className={cn("h-4 w-4", request.verificationStatus === 'Verified' ? "text-emerald-500" : "text-amber-500")} />
                                            <span className="text-xs font-bold">{request.verificationStatus}</span>
                                        </div>
                                        {request.verificationStatus === 'Verified' && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/70">Legal deadline</Label>
                                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-muted/30 group hover:bg-muted/50 transition-colors">
                                        <div className="p-1.5 rounded-lg bg-background border shadow-xs">
                                            <Clock className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold leading-none">{request.dueDate ? new Date(request.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">30-day compliance window</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="card-top-border border-evaluation transition-all duration-500 hover:shadow-md flex-1">
                        <CardHeader className="pb-3 px-5">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4 text-evaluation" />
                                Resolution Strategy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 px-5 pb-6">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold opacity-80 flex items-center gap-1.5">
                                        <History className="h-3.5 w-3.5 text-muted-foreground" />
                                        Case Notes
                                    </Label>
                                    <Badge variant="outline" className="text-[9px] font-bold uppercase py-0 px-1.5 h-4 border-muted-foreground/20 text-muted-foreground/60">Internal Only</Badge>
                                </div>
                                <Textarea
                                    className="resize-none h-48 bg-muted/30 border-border/40 focus:ring-evaluation/20 focus:border-evaluation transition-all text-sm leading-relaxed rounded-xl shadow-inner scrollbar-thin"
                                    placeholder="Outline the steps taken, internal findings, or specific challenges encountered during fulfillment..."
                                    defaultValue={request.resolutionNotes || ''}
                                    onBlur={(e) => updateStatusMutation.mutate({ id: request.id, resolutionNotes: e.target.value })}
                                />
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Zap className="h-3 w-3 text-brand-lime" />
                                        Real-time persistence active
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-mono opacity-50">v1.2</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="col-span-9 flex flex-col min-h-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col bg-card rounded-xl border shadow-sm animate-slide-left">
                        <div className="px-6 pt-4">
                            <TabsList className="w-full justify-start border-b rounded-none p-0 h-auto bg-transparent gap-8">
                                <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-4 text-sm font-bold tracking-tight transition-all data-[state=active]:text-primary opacity-60 data-[state=active]:opacity-100 h-14">Overview</TabsTrigger>
                                <TabsTrigger value="verification" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-4 text-sm font-bold tracking-tight transition-all data-[state=active]:text-primary opacity-60 data-[state=active]:opacity-100 h-14">Identity Verification</TabsTrigger>
                                <TabsTrigger value="collection" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-4 text-sm font-bold tracking-tight transition-all data-[state=active]:text-primary opacity-60 data-[state=active]:opacity-100 h-14">Data Collection</TabsTrigger>
                                <TabsTrigger value="response" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-4 text-sm font-bold tracking-tight transition-all data-[state=active]:text-primary opacity-60 data-[state=active]:opacity-100 h-14">Response Builder</TabsTrigger>
                                <TabsTrigger value="audit" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-4 text-sm font-bold tracking-tight transition-all data-[state=active]:text-primary opacity-60 data-[state=active]:opacity-100 h-14">Audit Log</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                            <TabsContent value="overview" className="space-y-8 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-muted/30 p-5 rounded-2xl border border-border/40 hover:bg-muted/50 transition-colors group">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                                                <Briefcase className="h-5 w-5" />
                                            </div>
                                            <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Structural Identity</Label>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">Request Archetype</p>
                                                <p className="text-lg font-bold tracking-tight">{request.requestType}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">Ingestion channel</p>
                                                <Badge variant="secondary" className="font-bold rounded-lg px-2.5 py-0.5 capitalize">{request.submissionMethod}</Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 p-5 rounded-2xl border border-border/40 hover:bg-muted/50 transition-colors group">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 rounded-lg bg-evaluation/10 border border-evaluation/20 text-evaluation">
                                                <Activity className="h-5 w-5" />
                                            </div>
                                            <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Operations & Assignment</Label>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">Urgency classification</p>
                                                <Badge variant={request.priority === 'critical' ? 'destructive' : 'secondary'} className="uppercase font-bold rounded-lg px-2.5 py-0.5">
                                                    {request.priority}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">Active respondent</p>
                                                <div className="flex items-center gap-2 mt-1 px-3 py-1.5 rounded-xl bg-background border shadow-xs w-fit">
                                                    <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center text-[10px] font-black text-primary-foreground shadow-sm">
                                                        {request.assigneeId ? 'JD' : '--'}
                                                    </div>
                                                    <span className="text-sm font-bold tracking-tight">{request.assigneeId ? 'John Doe' : 'Unassigned'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Card className="border-border/40 shadow-none bg-secondary/10 overflow-hidden">
                                    <div className="h-1 bg-primary/20" />
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2 tracking-tight">
                                            <Info className="h-4 w-4 text-primary" />
                                            Execution Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm leading-relaxed text-muted-foreground/80 font-medium">
                                        This {request.requestType.toLowerCase()} request was initiated on {new Date(request.requestDate!).toLocaleDateString()}.
                                        The current objective is to ensure {request.status === 'Completed' ? 'all obligations have been met' : 'verification and collection phases are expedited'}
                                        to remain within the Article 15 compliance window.
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="verification" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Card className="border-border/40 shadow-sm rounded-2xl overflow-hidden">
                                    <div className="bg-primary/5 px-6 py-4 border-b border-border/40 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-primary/10 text-primary border-primary/20 h-6 px-2 text-[10px] font-black">STEP 01</Badge>
                                            <div>
                                                <CardTitle className="text-base font-bold tracking-tight">Identity Authentication</CardTitle>
                                                <CardDescription className="text-[11px] font-medium">Mandatory verification protocols under GDPR/CCPA framework.</CardDescription>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "h-3 w-3 rounded-full animate-pulse",
                                            request.verificationStatus === 'Verified' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                                        )} />
                                    </div>
                                    <CardContent className="space-y-8 p-6">
                                        <div className="bg-info/5 p-5 rounded-2xl flex items-start gap-4 border border-info/20 group hover:bg-info/10 transition-colors">
                                            <div className="p-2 rounded-xl bg-background border shadow-xs text-info shrink-0">
                                                <AlertCircle className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-info flex items-center gap-1.5 uppercase tracking-wider mb-1">
                                                    Regulatory Insight
                                                    <Badge className="bg-info/10 text-info border-none h-4 text-[9px]">Recital 64</Badge>
                                                </p>
                                                <p className="text-sm text-info/80 leading-relaxed font-medium">Compliance teams must use "reasonable measures" to verify identity. Avoid collecting excessive metadata solely for the purpose of this verification.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Authentication methodology</Label>
                                            <Select
                                                defaultValue={request.verificationMethod || "email"}
                                                onValueChange={(val) => updateStatusMutation.mutate({ id: request.id, verificationMethod: val })}
                                            >
                                                <SelectTrigger className="rounded-xl h-12 border-border/60 bg-muted/20 hover:bg-muted/40 transition-all font-bold tracking-tight">
                                                    <SelectValue placeholder="Select method..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-border/60">
                                                    <SelectItem value="email" className="cursor-pointer font-medium">Email Validation (Magic Link)</SelectItem>
                                                    <SelectItem value="account" className="cursor-pointer font-medium">Existing Account Login</SelectItem>
                                                    <SelectItem value="id_document" className="cursor-pointer font-medium">ID Document (Passport/License)</SelectItem>
                                                    <SelectItem value="challenge" className="cursor-pointer font-medium">Challenge Questions</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Separator className="bg-border/40" />

                                        <div
                                            className={cn(
                                                "flex items-center space-x-4 p-5 rounded-2xl border transition-all cursor-pointer group select-none",
                                                request.verificationStatus === 'Verified' ? "bg-emerald-50 border-emerald-500/30 ring-1 ring-emerald-500/10" : "bg-muted/10 border-border/60 hover:border-primary/30"
                                            )}
                                            onClick={() => updateStatusMutation.mutate({
                                                id: request.id,
                                                verificationStatus: request.verificationStatus === 'Verified' ? 'Pending' : 'Verified',
                                                status: request.verificationStatus === 'Verified' ? 'In Progress' : request.status
                                            })}
                                        >
                                            <div className={cn(
                                                "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                                request.verificationStatus === 'Verified' ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/30 group-hover:border-primary/50"
                                            )}>
                                                {request.verificationStatus === 'Verified' && <CheckCircle2 className="h-4 w-4" />}
                                            </div>
                                            <div className="space-y-0.5">
                                                <Label className="font-bold text-sm cursor-pointer tracking-tight">Identity Confirmed</Label>
                                                <p className="text-[11px] text-muted-foreground font-medium">Check this if the requester's identity has been successfully authenticated.</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="collection" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Card className="border-border/40 shadow-sm rounded-2xl overflow-hidden">
                                    <div className="bg-primary/5 px-6 py-4 border-b border-border/40">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-primary/10 text-primary border-primary/20 h-6 px-2 text-[10px] font-black">STEP 02</Badge>
                                            <div>
                                                <CardTitle className="text-base font-bold tracking-tight">Data Inventory Search</CardTitle>
                                                <CardDescription className="text-[11px] font-medium">Track and document the search for the subject's personal data across local and cloud environments.</CardDescription>
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            {['CRM System', 'Marketing Database', 'Customer Support Tickets', 'Email Archives', 'HR Records', 'Billing System'].map((system, i) => (
                                                <div
                                                    key={system}
                                                    className="flex items-center space-x-3 border p-4 rounded-2xl hover:bg-muted/30 transition-all group cursor-pointer border-border/50 hover:border-primary/30 animate-in fade-in slide-in-from-right duration-300"
                                                    style={{ animationDelay: `${i * 50}ms` }}
                                                >
                                                    <Checkbox id={`check-${system}`} className="rounded-md h-5 w-5 data-[state=checked]:bg-primary" />
                                                    <div className="min-w-0">
                                                        <Label htmlFor={`check-${system}`} className="cursor-pointer font-bold text-sm tracking-tight truncate block">{system}</Label>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter opacity-50">Local node</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-8 flex items-start gap-3 p-4 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/30">
                                            <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">This checklist is maintained for internal audit trails and helps demonstrate accountability under GDPR Article 5(2). It does not automatically populate the final disclosure report.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="response" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <ResponseBuilder request={request} />
                            </TabsContent>

                            <TabsContent value="audit" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Card className="border-border/40 shadow-sm rounded-2xl overflow-hidden min-h-[400px]">
                                    <div className="bg-primary/5 px-6 py-4 border-b border-border/40">
                                        <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2">
                                            <History className="h-4 w-4 text-primary" />
                                            Action Timeline
                                        </CardTitle>
                                        <CardDescription className="text-[11px] font-medium">Immutable log of all administrative operations performed on this request.</CardDescription>
                                    </div>
                                    <CardContent className="p-8">
                                        <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-primary/20 before:via-primary/10 before:to-transparent">
                                            {(request.auditLog as any[])?.map((log, i) => (
                                                <div key={i} className="relative flex gap-6 pl-2 group animate-in fade-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                                                    <div className="relative z-10 p-1.5 rounded-full bg-background ring-4 ring-background border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                    </div>
                                                    <div className="pb-6 border-b border-border/40 w-full group-last:border-none">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                                {log.action}
                                                                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                                <span className="text-muted-foreground font-bold tracking-tight lowercase">by {log.user}</span>
                                                            </p>
                                                            <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                            </p>
                                                        </div>
                                                        <p className="text-sm text-foreground/80 font-medium leading-relaxed">{log.details}</p>
                                                        {log.action === 'COMPLETED' && (
                                                            <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 w-fit">
                                                                <CheckCircle className="h-3 w-3 text-emerald-500" />
                                                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Verified compliance</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {(!request.auditLog || (request.auditLog as any[]).length === 0) && (
                                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-40">
                                                    <History className="h-12 w-12 text-muted-foreground" />
                                                    <p className="text-sm font-bold tracking-tight">No activity logs recorded yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

function ResponseBuilder({ request }: { request: any }) {
    const [data, setData] = useState({
        personalDataFound: request.responseData?.personalDataFound || false,
        dataCategories: request.responseData?.dataCategories?.join('\n') || '',
        purposes: request.responseData?.purposes?.join('\n') || '',
        recipients: request.responseData?.recipients?.join('\n') || '',
        lawfulBasis: request.responseData?.lawfulBasis?.join('\n') || '',
        retentionPeriod: request.responseData?.retentionPeriod || '',
        sources: request.responseData?.sources || '',
        rightsInfo: request.responseData?.rightsInfo || "You have the right to request access, rectification, erasure, restriction, and portability of your personal data.",
    });

    const mutation = trpc.privacy.updateDsarResponseData.useMutation({
        onSuccess: () => {
            toast.success("Response framework saved successfully");
        },
        onError: (err) => {
            toast.error("Process failed: " + err.message);
        }
    });

    const handleSave = () => {
        mutation.mutate({
            id: request.id,
            responseData: {
                personalDataFound: data.personalDataFound,
                dataCategories: data.dataCategories.split('\n').filter((s: string) => s.trim()),
                purposes: data.purposes.split('\n').filter((s: string) => s.trim()),
                recipients: data.recipients.split('\n').filter((s: string) => s.trim()),
                lawfulBasis: data.lawfulBasis.split('\n').filter((s: string) => s.trim()),
                retentionPeriod: data.retentionPeriod,
                sources: data.sources,
                rightsInfo: data.rightsInfo
            }
        });
    };

    return (
        <Card className="border-border/40 shadow-sm rounded-2xl overflow-hidden border-t-4 border-t-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 bg-muted/5 border-b">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold tracking-tight">Article 15 Disclosure Generator</CardTitle>
                    <CardDescription className="text-xs font-medium">Construct the comprehensive disclosure report for the data subject.</CardDescription>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={mutation.isPending}
                    className="rounded-xl px-6 font-bold shadow-lg shadow-primary/10 transition-all hover:translate-y-[-1px] active:translate-y-0"
                >
                    {mutation.isPending ? (
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                            Saving...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Save Elements
                        </div>
                    )}
                </Button>
            </CardHeader>
            <CardContent className="space-y-8 p-6">
                <div
                    className={cn(
                        "flex items-start space-x-4 p-5 rounded-2xl border transition-all cursor-pointer group shadow-inner",
                        data.personalDataFound ? "bg-emerald-500/5 border-emerald-500/30" : "bg-destructive/5 border-destructive/20"
                    )}
                    onClick={() => setData({ ...data, personalDataFound: !data.personalDataFound })}
                >
                    <div className={cn(
                        "mt-1 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all",
                        data.personalDataFound ? "bg-emerald-500 border-emerald-500 text-white" : "border-destructive text-transparent"
                    )}>
                        {data.personalDataFound && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                    <div className="grid gap-1 px-1 select-none">
                        <Label className="font-bold text-base cursor-pointer tracking-tight">Personal Information Identified</Label>
                        <p className="text-xs text-muted-foreground font-medium max-w-lg">
                            Uncheck if the subject's personal data was not found or has been completely anonymized/deleted from all processing systems.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Categories of Data</Label>
                            <Badge variant="outline" className="text-[9px] h-4">Article 15(1)(b)</Badge>
                        </div>
                        <Textarea
                            value={data.dataCategories}
                            onChange={(e) => setData({ ...data, dataCategories: e.target.value })}
                            className="h-40 rounded-xl bg-muted/20 border-border/60 focus:ring-primary/20 transition-all font-medium text-sm leading-relaxed custom-scrollbar"
                            placeholder="e.g. Identity Data&#10;Contact Details&#10;Browsing History"
                        />
                        <p className="text-[10px] text-muted-foreground">List each category on a new line.</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Purposes of Processing</Label>
                            <Badge variant="outline" className="text-[9px] h-4">Article 15(1)(a)</Badge>
                        </div>
                        <Textarea
                            value={data.purposes}
                            onChange={(e) => setData({ ...data, purposes: e.target.value })}
                            className="h-40 rounded-xl bg-muted/20 border-border/60 focus:ring-primary/20 transition-all font-medium text-sm leading-relaxed custom-scrollbar"
                            placeholder="e.g. Execution of contract&#10;Marketing opt-in&#10;Legal record keeping"
                        />
                        <p className="text-[10px] text-muted-foreground">List each purpose on a new line.</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Recipients of Data</Label>
                            <Badge variant="outline" className="text-[9px] h-4">Article 15(1)(c)</Badge>
                        </div>
                        <Textarea
                            value={data.recipients}
                            onChange={(e) => setData({ ...data, recipients: e.target.value })}
                            className="h-40 rounded-xl bg-muted/20 border-border/60 focus:ring-primary/20 transition-all font-medium text-sm leading-relaxed custom-scrollbar"
                            placeholder="e.g. Cloud providers (AWS)&#10;Payment processors (Stripe)&#10;Third-party marketing partners"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Processing Lawfulness</Label>
                            <Badge variant="outline" className="text-[9px] h-4">Article 6</Badge>
                        </div>
                        <Textarea
                            value={data.lawfulBasis}
                            onChange={(e) => setData({ ...data, lawfulBasis: e.target.value })}
                            className="h-40 rounded-xl bg-muted/20 border-border/60 focus:ring-primary/20 transition-all font-medium text-sm leading-relaxed custom-scrollbar"
                            placeholder="e.g. Article 6(1)(b) - Contractual necessity&#10;Article 6(1)(a) - Consent"
                        />
                    </div>
                </div>

                <Separator className="bg-border/40" />

                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Retention period</Label>
                            <Badge variant="outline" className="text-[9px] h-4">Article 15(1)(d)</Badge>
                        </div>
                        <Input
                            value={data.retentionPeriod}
                            onChange={(e) => setData({ ...data, retentionPeriod: e.target.value })}
                            className="h-12 rounded-xl bg-muted/20 border-border/60 focus:ring-primary/20 transition-all font-bold tracking-tight"
                            placeholder="e.g., 7 years post-termination"
                        />
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Origin of data</Label>
                            <Badge variant="outline" className="text-[9px] h-4">Article 15(1)(g)</Badge>
                        </div>
                        <Input
                            value={data.sources}
                            onChange={(e) => setData({ ...data, sources: e.target.value })}
                            className="h-12 rounded-xl bg-muted/20 border-border/60 focus:ring-primary/20 transition-all font-bold tracking-tight"
                            placeholder="e.g., Direct collection, Public directories"
                        />
                    </div>
                </div>

                <div className="space-y-3 bg-primary/5 p-6 rounded-2xl border border-primary/10">
                    <div className="flex items-center justify-between mb-1">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-primary">Data Subject Rights Notification</Label>
                        <Badge className="bg-primary/20 text-primary border-none text-[9px]">Article 15(1)(e)</Badge>
                    </div>
                    <Textarea
                        value={data.rightsInfo}
                        onChange={(e) => setData({ ...data, rightsInfo: e.target.value })}
                        className="h-28 rounded-xl bg-background border-border/60 focus:ring-primary/30 transition-all font-medium text-sm leading-relaxed shadow-xs"
                    />
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-medium italic">
                        Standard regulatory language prepopulated. Adjust if specific jurisdictional requirements apply.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

