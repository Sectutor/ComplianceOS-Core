import { useParams } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { FrameworkMarketplace } from "@/components/frameworks/FrameworkMarketplace";
import { Breadcrumb } from "@/components/Breadcrumb";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function FrameworkMarketplacePage() {
    const params = useParams();
    const clientId = params.id ? parseInt(params.id) : undefined;

    const { data: client, isLoading } = trpc.clients.get.useQuery(
        { id: clientId! },
        { enabled: !!clientId }
    );

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 w-full max-w-full pb-10 px-6">
                <Breadcrumb
                    items={[
                        { label: "Clients", href: "/clients" },
                        clientId && client ? { label: client.name, href: `/clients/${clientId}` } : undefined,
                        { label: "Framework Marketplace" },
                    ].filter(Boolean) as any}
                />

                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Framework Marketplace</h1>
                    <p className="text-muted-foreground">
                        Discover and install compliance frameworks, standards, and regulations.
                    </p>
                </div>

                <FrameworkMarketplace />
            </div>
        </DashboardLayout>
    );
}
