
import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { FileText, Save, ArrowLeft, Download, CheckCircle, Clock, Trash2, Loader2, History } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";
import { format } from 'date-fns';
import { PageGuide } from "@/components/PageGuide";

export default function DPAEditor() {
    const [, params] = useRoute("/tprm/dpa-editor/:dpaId");
    const [, clientParams] = useRoute("/clients/:id/vendors/dpa-editor/:dpaId");

    const dpaId = parseInt(params?.dpaId || clientParams?.dpaId || "0");
    const queryParams = new URLSearchParams(window.location.search);
    const clientId = parseInt(clientParams?.id || queryParams.get("clientId") || "0");

    const { data: dpa, isLoading, refetch } = trpc.vendorDpas.get.useQuery({ id: dpaId, clientId }, { enabled: !!dpaId && !!clientId });
    const { data: vendor } = trpc.vendors.get.useQuery({ id: dpa?.vendorId as number }, { enabled: !!dpa?.vendorId });

    const [content, setContent] = useState("");
    const [name, setName] = useState("");
    const [status, setStatus] = useState("Draft");
    const [signedAt, setSignedAt] = useState("");

    useEffect(() => {
        if (dpa) {
            setContent(dpa.content || "");
            setName(dpa.name || "");
            setStatus(dpa.status || "Draft");
            setSignedAt(dpa.signedAt ? format(new Date(dpa.signedAt), 'yyyy-MM-dd') : "");
        }
    }, [dpa]);

    const updateMutation = trpc.vendorDpas.update.useMutation({
        onSuccess: () => {
            toast.success("DPA saved successfully");
            refetch();
        },
        onError: (err) => toast.error("Failed to save DPA: " + err.message)
    });

    const handleSave = () => {
        if (!name) return toast.error("Document name is required");
        updateMutation.mutate({
            id: dpaId,
            clientId,
            name,
            content,
            status,
            signedAt: signedAt || undefined
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!dpa) {
        return (
            <div className="p-6 text-center">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold">DPA Not Found</h2>
                <Button variant="link" onClick={() => window.history.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <PageGuide
                title="DPA Editor"
                description="Draft and customize Data Processing Agreements."
                rationale="Tailor legal terms to specific data categories and processing activities."
                howToUse={[
                    { step: "Draft", description: "Edit clauses using the rich text editor." },
                    { step: "Review", description: "Collaborate on terms and version control." },
                    { step: "Finalize", description: "Mark as signed and export PDF for records." }
                ]}
            />
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm sticky top-0 z-10 transition-all">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            {name}
                            <Badge variant="outline" className={
                                status === 'Signed' ? 'bg-green-50 text-green-700 border-green-200' :
                                    status === 'Review' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        'bg-slate-50 text-slate-700 border-slate-200'
                            }>
                                {status}
                            </Badge>
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Vendor: <span className="font-medium text-slate-900">{vendor?.name}</span> •
                            ID: <span className="font-medium text-slate-900">{dpaId}</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
                <div className="col-span-3 space-y-4">
                    <Card>
                        <CardHeader className="pb-3 border-b bg-slate-50/50">
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Agreement Content
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                className="border-0 rounded-none min-h-[600px]"
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Metadata & Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label className="text-xs">Document Name</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} />
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs">Processing Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Draft">Draft</SelectItem>
                                        <SelectItem value="Review">In Review</SelectItem>
                                        <SelectItem value="Signed">Signed / Active</SelectItem>
                                        <SelectItem value="Archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {status === 'Signed' && (
                                <div className="grid gap-2">
                                    <Label className="text-xs">Date Signed</Label>
                                    <Input
                                        type="date"
                                        value={signedAt}
                                        onChange={e => setSignedAt(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="pt-4 border-t space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Version:</span>
                                    <span className="font-medium">v{dpa.version}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Created:</span>
                                    <span className="font-medium">{dpa.createdAt ? format(new Date(dpa.createdAt), 'MMM d, yyyy') : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Updated:</span>
                                    <span className="font-medium">{dpa.updatedAt ? format(new Date(dpa.updatedAt), 'MMM d, yyyy') : 'N/A'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50/50 border-blue-100">
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
                                <History className="h-4 w-4" />
                                Audit Note
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-blue-700 space-y-2">
                            <p>This document is a legally binding Data Processing Agreement between your organization and <strong>{vendor?.name}</strong>.</p>
                            <p>Once signed, update the status to "Signed" and record the execution date for compliance tracking.</p>
                        </CardContent>
                    </Card>

                    <Button variant="ghost" className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 justify-start h-9 text-xs">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Document
                    </Button>
                </div>
            </div>
        </div>
    );
}
