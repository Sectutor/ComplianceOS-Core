
import React, { useState } from 'react';
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@complianceos/ui/ui/card";
import { Input } from "@complianceos/ui/ui/input";
import { Label } from "@complianceos/ui/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@complianceos/ui/ui/tabs";
import { Check, ChevronRight, ShieldAlert, FileText, Send, Building2, Globe, Brain } from "lucide-react";
import { toast } from "sonner";
import { trpc } from '@/lib/trpc';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@complianceos/ui/ui/select";
import { Textarea } from "@complianceos/ui/ui/textarea";

interface VendorOnboardingWizardProps {
    clientId: number;
    onComplete: () => void;
    onCancel: () => void;
}

export function VendorOnboardingWizard({ clientId, onComplete, onCancel }: VendorOnboardingWizardProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: "",
        website: "",
        category: "SaaS",
        description: "",
        criticality: "Low",
        contactEmail: "",
        dataCategories: [] as string[],
        transferMechanism: "None",
        dpaStatus: "Needed",
        templateId: null as number | null,
        usesAi: false,
        isAiService: false,
        aiDataUsage: ""
    });

    const [createdVendorId, setCreatedVendorId] = useState<number | null>(null);

    const createVendorMutation = trpc.vendors.create.useMutation({
        onSuccess: (data) => {
            setCreatedVendorId(data.id);
            setStep(2);
            toast.success("Vendor profile created");
        },
        onError: (err) => toast.error("Failed to create vendor: " + err.message)
    });

    const initiateAuthMutation = trpc.vendorAuthorizations.initiate.useMutation({
        onSuccess: () => {
            setStep(4);
            toast.success("Authorization workflow started");
        },
        onError: (err) => toast.error("Failed to start workflow: " + err.message)
    });

    const createDpaMutation = trpc.vendorDpas.createFromTemplate.useMutation({
        onSuccess: () => {
            toast.success("DPA generated from template");
        },
        onError: (err) => toast.error("Failed to generate DPA: " + err.message)
    });

    const { data: dpaTemplates } = trpc.dpaTemplates.list.useQuery();

    const handleNext = () => {
        if (step === 1) {
            if (!formData.name) return toast.error("Name is required");
            createVendorMutation.mutate({
                clientId,
                name: formData.name,
                website: formData.website,
                category: formData.category,
                description: formData.description,
                criticality: formData.criticality,
                status: "Onboarding",
                usesAi: formData.usesAi,
                isAiService: formData.isAiService,
                aiDataUsage: formData.aiDataUsage
            });
        } else if (step === 2) {
            // Mock saving data mapping
            setStep(3);
        } else if (step === 3) {
            // Trigger workflow
            if (createdVendorId) {
                // Generate DPA if selected
                if (formData.templateId) {
                    createDpaMutation.mutate({
                        clientId,
                        vendorId: createdVendorId,
                        templateId: formData.templateId,
                        name: `${formData.name} DPA - ${new Date().toLocaleDateString()}`
                    });
                }

                initiateAuthMutation.mutate({
                    vendorId: createdVendorId,
                    clientId: clientId
                });
            } else {
                setStep(4);
            }
        } else {
            onComplete();
        }
    };

    return (
        <div className="w-full !p-6 max-w-none">
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-200 -z-10"></div>
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className={`flex flex-col items-center gap-2 bg-white px-2 ${step >= s ? 'text-blue-600' : 'text-slate-400'}`}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step >= s ? 'bg-blue-50 border-blue-600 font-bold' : 'bg-white border-slate-300'
                                }`}>
                                {step > s ? <Check className="h-4 w-4" /> : s}
                            </div>
                            <span className="text-xs font-medium">
                                {s === 1 ? 'Profile' : s === 2 ? 'Data Impact' : s === 3 ? 'Legal' : 'Finish'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <Card className="w-full max-w-none">
                <CardHeader>
                    <CardTitle>
                        {step === 1 && "Vendor Profile"}
                        {step === 2 && "Data Impact Assessment"}
                        {step === 3 && "Legal & Compliance"}
                        {step === 4 && "Authorization Sent"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && "Basic information to identify the subprocessor."}
                        {step === 2 && "Map the data flows and categories processed."}
                        {step === 3 && "Ensure necessary agreements like DPAs are in place."}
                        {step === 4 && "The onboarding request is now pending approval."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 1 && (
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Vendor Name</Label>
                                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. AWS" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Website</Label>
                                    <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://..." />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="What service do they provide?" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SaaS">SaaS</SelectItem>
                                            <SelectItem value="IaaS">IaaS</SelectItem>
                                            <SelectItem value="Service">Service Provider</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Criticality</Label>
                                    <Select value={formData.criticality} onValueChange={v => setFormData({ ...formData, criticality: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Low">Low</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="High">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Brain className="h-5 w-5 text-primary" />
                                    <h4 className="font-bold text-primary">AI-Specific Governance</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.usesAi}
                                            onChange={e => setFormData({ ...formData, usesAi: e.target.checked })}
                                            className="rounded border-slate-300"
                                        />
                                        <span className="text-sm font-medium">Uses AI in Service</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isAiService}
                                            onChange={e => setFormData({ ...formData, isAiService: e.target.checked })}
                                            className="rounded border-slate-300"
                                        />
                                        <span className="text-sm font-medium">Core AI Service Provider</span>
                                    </label>
                                </div>
                                {(formData.usesAi || formData.isAiService) && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                        <Label>AI Data Usage (MAP 1.5)</Label>
                                        <Input
                                            value={formData.aiDataUsage}
                                            onChange={e => setFormData({ ...formData, aiDataUsage: e.target.value })}
                                            placeholder="e.g. Inputs used for training, Zero retention, etc."
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="p-4 bg-slate-50 border rounded-lg">
                                <h4 className="font-medium mb-2 flex items-center"><ShieldAlert className="h-4 w-4 mr-2" /> Data Categories</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Contact Info', 'Financial Data', 'Health Data', 'Employee Data', 'Customer Content', 'Technical Logs'].map(cat => (
                                        <label key={cat} className="flex items-center space-x-2 border p-2 rounded bg-white cursor-pointer hover:bg-slate-50">
                                            <input type="checkbox" className="rounded border-slate-300" />
                                            <span className="text-sm">{cat}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Data Transfer Mechanism (Cross-Border)</Label>
                                <Select value={formData.transferMechanism} onValueChange={v => setFormData({ ...formData, transferMechanism: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="None">None (In-Region)</SelectItem>
                                        <SelectItem value="SCCs">Standard Contractual Clauses (SCCs)</SelectItem>
                                        <SelectItem value="DPF">Data Privacy Framework (DPF)</SelectItem>
                                        <SelectItem value="Adequacy">Adequacy Decision</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="border border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50">
                                <FileText className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                                <h4 className="font-medium text-slate-900">Data Processing Agreement (DPA)</h4>
                                <p className="text-sm text-slate-500 mb-4">Upload the signed DPA or select a standard template to generate one.</p>

                                <div className="max-w-xs mx-auto space-y-2">
                                    <Label>Select Template</Label>
                                    <Select value={String(formData.templateId || "")} onValueChange={(v) => setFormData({ ...formData, templateId: Number(v) })}>
                                        <SelectTrigger><SelectValue placeholder="Standard Templates" /></SelectTrigger>
                                        <SelectContent>
                                            {dpaTemplates?.map(t => (
                                                <SelectItem key={t.id} value={String(t.id)}>{t.name} ({t.jurisdiction})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex justify-center gap-2 mt-4">
                                    <Button variant="outline" size="sm">Upload PDF</Button>
                                    <Button variant="outline" size="sm">Preview Selected</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center py-6">
                            <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Request Initiated!</h3>
                            <p className="text-slate-500 max-w-md mx-auto mt-2">
                                The new subprocessor <strong>{formData.name}</strong> has been added in "Onboarding" status. An authorization request has been logged.
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    {step < 4 ? (
                        <>
                            <Button variant="outline" onClick={step === 1 ? onCancel : () => setStep(step - 1)}>
                                {step === 1 ? 'Cancel' : 'Back'}
                            </Button>
                            <Button onClick={handleNext}>
                                {step === 3 ? 'Submit Request' : 'Next'} <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <Button className="w-full" onClick={onComplete}>Return to Vendors</Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
