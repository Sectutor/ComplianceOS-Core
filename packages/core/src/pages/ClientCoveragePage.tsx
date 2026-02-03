import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@complianceos/ui/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";
import PolicyCoverage from "@/components/PolicyCoverage";

export default function ClientCoveragePage() {
    const { user } = useAuth();
    const params = useParams();
    const [location, setLocation] = useLocation();
    const clientId = parseInt(params.clientId || "0");

    // Fetch client details for breadcrumb
    const { data: client, isLoading: clientLoading } = trpc.clients.get.useQuery(
        { id: clientId },
        { enabled: clientId > 0 }
    );

    // Redirect if invalid client ID
    useEffect(() => {
        if (!clientId) {
            setLocation('/clients');
        }
    }, [clientId, setLocation]);

    if (clientLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!client) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-full">
                    <h2 className="text-xl font-semibold mb-2">Client not found</h2>
                    <Button variant="outline" onClick={() => setLocation('/clients')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Clients
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <Breadcrumb
                    items={[
                        { label: "Clients", href: "/clients" },
                        { label: client.name, href: `/clients/${clientId}/governance` },
                        { label: "Coverage" },
                    ]}
                />

                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Compliance Coverage</h2>
                        <p className="text-muted-foreground">
                            Analyze how your controls map to policies and identify gaps.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6">
                    <PolicyCoverage clientId={clientId} />
                </div>
            </div>
        </DashboardLayout>
    );
}
