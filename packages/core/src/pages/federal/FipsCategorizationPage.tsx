import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation, useParams } from "wouter";
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@complianceos/ui/ui/card";
import { ArrowLeft, Lock, ShieldCheck, Save, Loader2 } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Badge } from "@complianceos/ui/ui/badge";

const IMPACT_LEVELS = ['Low', 'Moderate', 'High'];

export default function FipsCategorizationPage() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");
    const [_location, setLocation] = useLocation();

    const [impacts, setImpacts] = useState<{
        Confidentiality: string;
        Integrity: string;
        Availability: string;
    }>({
        Confidentiality: '',
        Integrity: '',
        Availability: ''
    });

    const [watermark, setWatermark] = useState<string>('Not Categorized');

    // Fetch existing data
    const { data: categorization, isLoading } = trpc.federal.getFipsCategorization.useQuery({ clientId });
    const utils = trpc.useUtils();

    // Sync state
    useEffect(() => {
        if (categorization) {
            setImpacts({
                Confidentiality: categorization.confidentialityImpact || '',
                Integrity: categorization.integrityImpact || '',
                Availability: categorization.availabilityImpact || ''
            });
            setWatermark(categorization.highWaterMark || 'Not Categorized');
        }
    }, [categorization]);

    // Calculate watermark
    useEffect(() => {
        const levels = Object.values(impacts);
        if (levels.some(l => !l)) {
            setWatermark('Not Categorized');
            return;
        }
        if (levels.includes('High')) setWatermark('High');
        else if (levels.includes('Moderate')) setWatermark('Moderate');
        else setWatermark('Low');
    }, [impacts]);

    const saveMutation = trpc.federal.saveFipsCategorization.useMutation({
        onSuccess: () => {
            toast.success("FIPS 199 Categorization saved successfully");
            utils.federal.getFipsCategorization.invalidate({ clientId });
        },
        onError: (err) => {
            toast.error("Failed to save categorization", { description: err.message });
        }
    });

    const handleSave = () => {
        saveMutation.mutate({
            clientId,
            confidentialityImpact: impacts.Confidentiality,
            integrityImpact: impacts.Integrity,
            availabilityImpact: impacts.Availability,
            highWaterMark: watermark,
            status: 'completed' // Simple status
        });
    };

    const getVariant = (current: string, level: string) => {
        return current === level ? "default" : "outline";
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-20 px-6">
                {/* Breadcrumb ... copied from original */}
                <Breadcrumb
                    items={[
                        { label: "Federal", href: `/clients/${clientId}/federal` },
                        { label: "FIPS 199 Categorization" },
                    ]}
                />

                <div className="flex items-center justify-between">
                    <div>
                        <Button variant="ghost" className="mb-2 pl-0 hover:pl-2 transition-all" onClick={() => setLocation(`/clients/${clientId}/federal`)}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                        </Button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">FIPS 199 Security Categorization</h1>
                            {categorization?.status === 'completed' && <Badge variant="secondary" className="bg-green-100 text-green-700">Completed</Badge>}
                        </div>
                        <p className="text-muted-foreground mt-1">Determine the security impact level of your information system.</p>
                    </div>
                    <Button onClick={handleSave} disabled={saveMutation.isPending || watermark === 'Not Categorized'}>
                        {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Categorization
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <div className="grid gap-6 md:grid-cols-3">
                            {['Confidentiality', 'Integrity', 'Availability'].map((objective) => (
                                <Card key={objective} className={impacts[objective as keyof typeof impacts] ? 'border-primary/20 bg-primary/5' : ''}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            {objective}
                                            {impacts[objective as keyof typeof impacts] && (
                                                <Badge>{impacts[objective as keyof typeof impacts]}</Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription>
                                            {objective === 'Confidentiality' && "Preserving authorized restrictions on information access and disclosure."}
                                            {objective === 'Integrity' && "Guarding against improper information modification or destruction."}
                                            {objective === 'Availability' && "Ensuring timely and reliable access to and use of information."}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {IMPACT_LEVELS.map((level) => (
                                                <Button
                                                    key={level}
                                                    variant={getVariant(impacts[objective as keyof typeof impacts], level)}
                                                    className="w-full justify-start relative"
                                                    onClick={() => setImpacts(prev => ({ ...prev, [objective]: level }))}
                                                >
                                                    {level} Impact
                                                    {impacts[objective as keyof typeof impacts] === level && (
                                                        <div className="absolute right-3 w-2 h-2 rounded-full bg-primary" />
                                                    )}
                                                </Button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Card className="mt-6 bg-slate-50 border-dashed">
                            <CardHeader>
                                <CardTitle className="text-lg">System Security Category (High Water Mark)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-full border shadow-sm ${watermark !== 'Not Categorized' ? 'bg-primary text-primary-foreground' : 'bg-white'}`}>
                                        <ShieldCheck className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-2xl">{watermark}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            SC information system = {(impacts.Confidentiality && impacts.Integrity && impacts.Availability) ?
                                                `{ (confidentiality, ${impacts.Confidentiality}), (integrity, ${impacts.Integrity}), (availability, ${impacts.Availability}) }` :
                                                "Select impact levels for all three objectives to determine the system watermark."}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
