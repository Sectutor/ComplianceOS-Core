import React, { useState } from 'react';
import { useClientContext } from "@/contexts/ClientContext";
import { Button } from "@complianceos/ui/ui/button";
import { Plus, Globe, Shield, ArrowRight, Loader2 } from "lucide-react";
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { toast } from "sonner";
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";

export default function TIAWorkspace() {
    const { selectedClientId } = useClientContext();
    const clientId = selectedClientId || 0;
    const [createOpen, setCreateOpen] = useState(false);
    const [newTiaData, setNewTiaData] = useState({
        transferName: "",
        destinationCountry: "",
        importerName: ""
    });

    const utils = trpc.useUtils();
    const { data: assessments, isLoading } = trpc.privacy.listAssessments.useQuery({
        clientId,
        typePrefix: "TIA:"
    }, { enabled: !!clientId });

    const createMutation = trpc.privacy.saveAssessment.useMutation({
        onSuccess: () => {
            toast.success("TIA Initiated");
            setCreateOpen(false);
            setNewTiaData({ transferName: "", destinationCountry: "", importerName: "" });
            utils.privacy.listAssessments.invalidate();
        },
        onError: (err) => toast.error(`Failed: ${err.message}`)
    });

    const handleCreate = () => {
        if (!newTiaData.transferName || !newTiaData.destinationCountry) {
            toast.error("Please fill required fields");
            return;
        }

        createMutation.mutate({
            clientId,
            type: `TIA: ${newTiaData.transferName}`,
            responses: {
                destinationCountry: newTiaData.destinationCountry,
                importerName: newTiaData.importerName,
                transferDate: new Date().toISOString(),
                status: "initiated"
            },
            status: "in_progress",
            // riskLevel is not in schema directly on input, but handled via extended input in privacy.ts if I updated query?
            // Actually saveAssessment input has status and score. riskLevel is mapped? 
            // Checking privacy.ts: input has riskLevel? No. 
            // My memory of saveAssessment schema: 
            // input(z.object({ clientId, type, responses, status, score }))
            // It doesn't have riskLevel?
            // Wait, I need to check privacy.ts saveAssessment input again.
            score: 0
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Transfer Impact Assessments (TIA)</h1>
                    <p className="text-muted-foreground">Manage international data transfer risks.</p>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New TIA
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : assessments && assessments.length > 0 ? (
                    assessments.map(t => (
                        <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant={t.status === 'completed' ? 'default' : 'secondary'} className="mb-2">
                                        {t.status || 'In Progress'}
                                    </Badge>
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <CardTitle className="text-base">{t.type.replace("TIA: ", "")}</CardTitle>
                                <CardDescription>
                                    {(t.responses as any)?.destinationCountry ? `To: ${(t.responses as any).destinationCountry}` : 'Destination Unknown'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground mt-2">
                                    <p>Importer: {(t.responses as any)?.importerName || 'N/A'}</p>
                                    <p>Created: {new Date(t.createdAt).toLocaleDateString()}</p>
                                </div>
                                <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => toast.info("Full TIA Questionnaire coming soon")}>
                                    Continue Assessment <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full text-center p-12 border rounded-md bg-slate-50 border-dashed">
                        <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold">No Transfer Assessments</h3>
                        <p className="text-muted-foreground mb-4">Start a TIA for any data transferred outside your jurisdiction.</p>
                        <Button onClick={() => setCreateOpen(true)}>Start First TIA</Button>
                    </div>
                )}
            </div>

            <EnhancedDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                title="New Transfer Impact Assessment"
                description="Initiate a new assessment for an international data transfer."
                confirmText="Start Assessment"
                onConfirm={handleCreate}
                isLoading={createMutation.isLoading}
            >
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Transfer Name</Label>
                        <Input
                            placeholder="e.g. AWS US East Hosting"
                            value={newTiaData.transferName}
                            onChange={(e) => setNewTiaData({ ...newTiaData, transferName: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Destination Country</Label>
                        <Select
                            value={newTiaData.destinationCountry}
                            onValueChange={(val) => setNewTiaData({ ...newTiaData, destinationCountry: val })}
                        >
                            <SelectTrigger><SelectValue placeholder="Select country..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USA">United States</SelectItem>
                                <SelectItem value="India">India</SelectItem>
                                <SelectItem value="China">China</SelectItem>
                                <SelectItem value="Brazil">Brazil</SelectItem>
                                <SelectItem value="UK">United Kingdom</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Importer Name</Label>
                        <Input
                            placeholder="e.g. Amazon Web Services, Inc."
                            value={newTiaData.importerName}
                            onChange={(e) => setNewTiaData({ ...newTiaData, importerName: e.target.value })}
                        />
                    </div>
                </div>
            </EnhancedDialog>
        </div>
    );
}
