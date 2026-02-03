// import { useClientContext } from "../contexts/ClientContext"; // Not needed if passed as prop
import { useBilling } from "../hooks/useBilling";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { Check, CreditCard, Shield, Zap, Server } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/planLimits";
import type { Client } from "@/schema";

export default function BillingSettings({ client }: { client: Client }) {
    // const { client } = useClientContext(); // Removed
    const { billingEnabled, upgradeToPro, upgradeToEnterprise, manageSubscription, isLoading } = useBilling();

    if (!billingEnabled) {
        return (
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Management</CardTitle>
                        <CardDescription>Billing is currently disabled for this instance.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (!client) return <div>Loading...</div>;

    const isPro = client.planTier === 'pro' || client.planTier === 'enterprise';
    const isFree = !isPro;

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Subscription & Billing</h2>
                    <p className="text-muted-foreground">Manage your plan and payment details.</p>
                </div>
                {isPro && (
                    <Button variant="outline" onClick={() => manageSubscription(client.id)} disabled={isLoading}>
                        {isLoading ? "Loading..." : "Manage Subscription"}
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Free Plan Card */}
                <Card className={isFree ? "border-primary" : ""}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    Subscription (DIY)
                                    {isFree && <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Current</Badge>}
                                </CardTitle>
                                <CardDescription>Perfect for small teams starting their journey.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <FeatureItem text="Self-Service Dashboard" checked />
                        <FeatureItem text="Compliance Success Path" checked />
                        <FeatureItem text="Basic Policy Templates" checked />
                        <FeatureItem text="1 Organization Limit" />
                        <FeatureItem text="Community Support" />
                    </CardContent>
                    <CardFooter>
                        {isFree ? (
                            <Button variant="ghost" disabled className="w-full">Active Plan</Button>
                        ) : (
                            <Button variant="ghost" disabled className="w-full">Included in Higher Tiers</Button>
                        )}
                    </CardFooter>
                </Card>

                {/* Pro Plan Card */}
                <Card className={client.planTier === 'pro' ? "border-indigo-600 shadow-lg" : "bg-muted/50"}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    vCISO (Guided)
                                    {client.planTier === 'pro' && <Badge variant="default" className="bg-indigo-600">Current</Badge>}
                                </CardTitle>
                                <CardDescription>Expert guidance for your security roadmap.</CardDescription>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-bold">$49</span>
                                <span className="text-muted-foreground">/mo</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <FeatureItem text="Advisor-Set Weekly Focus" checked />
                        <FeatureItem text="AI Evidence Triage (Basic)" checked />
                        <FeatureItem text="Guided Compliance Review" checked />
                        <FeatureItem text="Up to 5 Organizations" checked />
                        <FeatureItem text="Priority Support" checked />
                    </CardContent>
                    <CardFooter>
                        {client.planTier === 'pro' ? (
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => manageSubscription(client.id)} disabled={isLoading}>
                                Manage Billing
                            </Button>
                        ) : (
                            <Button className="w-full border-indigo-600 text-indigo-600 hover:bg-indigo-50" variant="outline" onClick={() => upgradeToPro(client.id)} disabled={isLoading}>
                                <Zap className="mr-2 h-4 w-4" />
                                {client.planTier === 'enterprise' ? "Downgrade to Guided" : "Upgrade to Guided"}
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                {/* Enterprise Plan Card */}
                <Card className={client.planTier === 'enterprise' ? "border-amber-500 shadow-lg" : "bg-slate-900 text-white"}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    Full Service (Managed)
                                    {client.planTier === 'enterprise' && <Badge variant="default" className="bg-amber-500">Current</Badge>}
                                </CardTitle>
                                <CardDescription className={client.planTier === 'enterprise' ? "" : "text-slate-400"}>We handle everything for you.</CardDescription>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-bold">$499</span>
                                <span className="text-muted-foreground">/mo</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <FeatureItem text="Full Managed Compliance" checked />
                        <FeatureItem text="AI Document Processing" checked />
                        <FeatureItem text="Automated Evidence Mapping" checked />
                        <FeatureItem text="Unlimited Organizations" checked />
                        <FeatureItem text="Dedicated Account Manager" checked />
                    </CardContent>
                    <CardFooter>
                        {client.planTier === 'enterprise' ? (
                            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={() => manageSubscription(client.id)} disabled={isLoading}>
                                Manage Billing
                            </Button>
                        ) : (
                            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={() => upgradeToEnterprise(client.id)} disabled={isLoading}>
                                <Shield className="mr-2 h-4 w-4" />
                                Upgrade to Managed
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>

            {/* Billing History Placeholder */}
            {isPro && (
                <Card>
                    <CardHeader>
                        <CardTitle>Billing History</CardTitle>
                        <CardDescription>View your past invoices and payment receipts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Manage invoices in the Stripe Portal.
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function FeatureItem({ text, checked = false }: { text: string, checked?: boolean }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            <div className={`flex items-center justify-center h-5 w-5 rounded-full ${checked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                <Check className="h-3 w-3" />
            </div>
            <span className={checked ? "font-medium" : "text-muted-foreground"}>{text}</span>
        </div>
    );
}
