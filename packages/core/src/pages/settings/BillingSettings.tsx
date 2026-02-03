import React, { useState } from 'react';
import { Button } from "@complianceos/ui/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Badge } from "@complianceos/ui/ui/badge";
import { trpc } from '@/lib/trpc';
import { useBilling } from '@/hooks/useBilling';
import { toast } from 'sonner';
import { Check, Star, Building2, Shield, Lock } from 'lucide-react';

interface BillingSettingsProps {
    clientId: number;
}

export function BillingSettings({ clientId }: BillingSettingsProps) {
    const { billingEnabled } = useBilling();
    const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');

    if (!billingEnabled) return null;

    const { data: client, isLoading } = trpc.clients.get.useQuery({ id: clientId });
    const createCheckout = trpc.billing.createCheckout.useMutation();
    const createPortal = trpc.billing.createPortal.useMutation();

    const handleSubscribe = async (tier: 'startup' | 'pro' | 'enterprise') => {
        try {
            const { url } = await createCheckout.mutateAsync({
                clientId,
                tier,
                interval: billingPeriod,
                successUrl: window.location.href,
                cancelUrl: window.location.href,
            });
            if (url) window.location.href = url;
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handlePortal = async () => {
        try {
            const { url } = await createPortal.mutateAsync({
                clientId,
                returnUrl: window.location.href,
            });
            if (url) window.location.href = url;
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (isLoading) return <div>Loading billing info...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Subscription & Billing</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your subscription plan and billing details.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>You are currently on the <strong>{client?.planTier || 'Free'}</strong> plan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            Status: <span className="capitalize font-medium">{client?.subscriptionStatus || 'Inactive'}</span>
                        </div>
                        {client?.stripeCustomerId && (
                            <Button variant="outline" onClick={handlePortal} disabled={createPortal.isPending}>
                                Manage Subscription
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {!client?.stripeCustomerId && (
                <div className="space-y-8">
                    {/* Billing Toggle */}
                    <div className="flex justify-center">
                        <div className="flex items-center p-1 bg-muted rounded-lg border">
                            <button
                                onClick={() => setBillingPeriod('month')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${billingPeriod === 'month' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingPeriod('year')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${billingPeriod === 'year' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Yearly <span className="ml-1 text-xs text-green-600 font-bold">-16%</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Self-Service */}
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-lg">Self-Service</CardTitle>
                                <div className="mt-2 text-2xl font-bold">
                                    ${billingPeriod === 'month' ? '199' : '1,999'}
                                    <span className="text-sm font-normal text-muted-foreground">/{billingPeriod === 'month' ? 'mo' : 'yr'}</span>
                                </div>
                                <CardDescription>1 Organization</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                                <Button className="w-full mt-auto" onClick={() => handleSubscribe('startup')}>Upgrade</Button>
                            </CardContent>
                        </Card>

                        {/* Growth */}
                        <Card className="flex flex-col border-primary/50 relative">
                            <div className="absolute top-0 right-0 p-2">
                                <Badge variant="secondary" className="text-xs">Best Value</Badge>
                            </div>
                            <CardHeader>
                                <CardTitle className="text-lg">ComplianceOS Growth</CardTitle>
                                <div className="mt-2 text-2xl font-bold">
                                    ${billingPeriod === 'month' ? '299' : '2,999'}
                                    <span className="text-sm font-normal text-muted-foreground">/{billingPeriod === 'month' ? 'mo' : 'yr'}</span>
                                </div>
                                <CardDescription>10 Organizations</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                                <Button className="w-full mt-auto" onClick={() => handleSubscribe('pro')}>Upgrade</Button>
                            </CardContent>
                        </Card>

                        {/* Partially Managed */}
                        <Card className="flex flex-col border-purple-500/20">
                            <CardHeader>
                                <CardTitle className="text-lg">Partially Managed</CardTitle>
                                <div className="mt-2 text-2xl font-bold">Custom</div>
                                <CardDescription>Consulting & Mentorship</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                                <Button variant="outline" className="w-full mt-auto" asChild>
                                    <a href="/managed-services" target="_blank">View Details</a>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Fully Managed */}
                        <Card className="flex flex-col bg-slate-900 text-white border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-lg text-white">Fully Managed</CardTitle>
                                <div className="mt-2 text-2xl font-bold text-white">Custom</div>
                                <CardDescription className="text-slate-400">Full Outsourcing</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                                <Button className="w-full mt-auto bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                                    <a href="/managed-services" target="_blank">View Details</a>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

function CheckItem({ text }: { text: string }) {
    return (
        <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>{text}</span>
        </li>
    )
}
