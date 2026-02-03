import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@complianceos/ui/ui/card";
import { trpc } from "@/lib/trpc";
import { Button } from "@complianceos/ui/ui/button";
import { useLocation } from "wouter";
import { Building2, CreditCard } from "lucide-react";

export default function AdminBillingPage() {
    const [, setLocation] = useLocation();
    const { data: clients, isLoading } = trpc.clients.list.useQuery();

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Billing Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage billing and subscriptions for all clients
                    </p>
                </div>

                {isLoading ? (
                    <div>Loading clients...</div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {clients?.map((client) => (
                            <Card key={client.id} className="hover:border-primary transition-colors">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Building2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{client.name}</CardTitle>
                                            <CardDescription className="text-xs">
                                                {client.industry}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Plan:</span>
                                            <span className="font-medium capitalize">
                                                {client.planTier || 'Free'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Status:</span>
                                            <span className="font-medium capitalize">
                                                {client.subscriptionStatus || 'Inactive'}
                                            </span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => setLocation(`/clients/${client.id}/settings`)}
                                        >
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            Manage Billing
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
