
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function NewGapAnalysis() {
    const params = useParams();
    const [_, setLocation] = useLocation();
    const clientId = Number(params.id);

    const [name, setName] = useState("");
    const [framework, setFramework] = useState("");
    const [scope, setScope] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createMutation = trpc.gapAnalysis.create.useMutation();

    const handleCreate = async () => {
        if (!name || !framework) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const assessment = await createMutation.mutateAsync({
                clientId,
                name,
                framework,
                scope
            });
            toast.success("Gap Analysis started successfully");
            setLocation(`/clients/${clientId}/gap-analysis/${assessment.id}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to create assessment");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8 max-w-3xl mx-auto space-y-6">
                <Button variant="ghost" className="pl-0 hover:bg-transparent" onClick={() => setLocation(`/clients/${clientId}/gap-analysis`)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
                </Button>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">New Gap Analysis</h1>
                    <p className="text-muted-foreground">Start a new assessment to benchmark your security posture.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Assessment Details</CardTitle>
                        <CardDescription>Define the scope and framework for this analysis.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Assessment Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                placeholder="e.g. Q1 2025 ISO 27001 Assessment"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="framework">Framework <span className="text-red-500">*</span></Label>
                            <Select onValueChange={setFramework} value={framework}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Framework" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ISO 27001:2022">ISO 27001:2022</SelectItem>
                                    <SelectItem value="SOC 2 Type II">SOC 2 Type II</SelectItem>
                                    <SelectItem value="NIST CSF 2.0">NIST CSF 2.0</SelectItem>
                                    <SelectItem value="NIST 800-171">NIST 800-171 (CMMC L2)</SelectItem>
                                    <SelectItem value="HIPAA Security Rule">HIPAA Security Rule</SelectItem>
                                    <SelectItem value="GDPR">GDPR</SelectItem>
                                    <SelectItem value="PCI DSS 4.0">PCI DSS 4.0</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="scope">Scope Description</Label>
                            <Textarea
                                id="scope"
                                placeholder="Describe the boundaries of this assessment (e.g. Cloud Infrastructure, HR Systems)"
                                className="min-h-[100px]"
                                value={scope}
                                onChange={(e) => setScope(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setLocation(`/clients/${clientId}/gap-analysis`)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Start Assessment
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </DashboardLayout>
    );
}
