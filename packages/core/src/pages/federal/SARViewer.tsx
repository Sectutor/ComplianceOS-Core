import React, { useState } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation, useParams } from "wouter";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { ArrowLeft, FileText, Download, Plus, Loader2 } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { EnhancedDialog } from "@complianceos/ui/ui/enhanced-dialog";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";

export default function SARViewer() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [_location, setLocation] = useLocation();
    const [createOpen, setCreateOpen] = useState(false);
    const [newSarTitle, setNewSarTitle] = useState("");

    const utils = trpc.useUtils();
    const { data: sars, isLoading } = trpc.federal.listSARs.useQuery({ clientId });

    const createMutation = trpc.federal.createSAR.useMutation({
        onSuccess: (data) => {
            toast.success("SAR created successfully");
            setCreateOpen(false);
            setNewSarTitle("");
            utils.federal.listSARs.invalidate({ clientId });
        },
        onError: (err) => {
            toast.error("Failed to create SAR", { description: err.message });
        }
    });

    const handleCreate = () => {
        if (!newSarTitle) return;
        createMutation.mutate({
            clientId,
            title: newSarTitle,
            assessorName: "Internal Assessor" // Default for now
        });
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-20 px-6">
                <Breadcrumb
                    items={[
                        { label: "Federal", href: `/clients/${clientId}/federal` },
                        { label: "Security Assessment Reports" },
                    ]}
                />

                <div className="flex items-center justify-between">
                    <div>
                        <Button variant="ghost" className="mb-2 pl-0 hover:pl-2 transition-all" onClick={() => setLocation(`/clients/${clientId}/federal`)}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">Security Assessment Reports (SAR)</h1>
                        <p className="text-muted-foreground mt-1">Manage and review your security assessment findings.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" /> Export PDF
                        </Button>
                        <Button onClick={() => setCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> New Assessment
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (sars && sars.length > 0) ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {sars.map((sar: any) => (
                            <Card key={sar.id} className="cursor-pointer hover:border-primary transition-colors">
                                <CardHeader>
                                    <CardTitle>{sar.title}</CardTitle>
                                    <CardDescription>Created: {new Date(sar.createdAt).toLocaleDateString()}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                        <span>Status: {sar.status || 'Draft'}</span>
                                        <FileText className="h-4 w-4" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Assessment Summary</CardTitle>
                            <CardDescription>Overall compliance posture based on latest assessment.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-8 text-center text-muted-foreground bg-muted/10 rounded-lg border-dashed border-2">
                                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium text-foreground">No Assessment Data</h3>
                                <p className="mb-4">Run a security assessment to generate finding data for the SAR.</p>
                                <Button onClick={() => setCreateOpen(true)} variant="outline">
                                    Create First SAR
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <EnhancedDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    title="Create New SAR"
                    description="Start a new Security Assessment Report."
                    primaryAction={{
                        label: "Create Report",
                        onClick: handleCreate,
                        disabled: !newSarTitle || createMutation.isPending,
                        loading: createMutation.isPending
                    }}
                >
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="sar-title">Report Title</Label>
                            <Input
                                id="sar-title"
                                value={newSarTitle}
                                onChange={(e) => setNewSarTitle(e.target.value)}
                                placeholder="e.g. Q1 2026 Security Assessment"
                            />
                        </div>
                    </div>
                </EnhancedDialog>
            </div>
        </DashboardLayout>
    );
}
