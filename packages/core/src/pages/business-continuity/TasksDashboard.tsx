
import { BCTaskBoard } from "@/components/BCTaskBoard";
import { useParams, useLocation } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@complianceos/ui/ui/button";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function TasksDashboard() {
    const params = useParams();
    const clientId = params.id;
    const [_location, setLocation] = useLocation();
    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="mb-6">
                    <Breadcrumb
                        items={[
                            { label: "Clients", href: "/clients" },
                            { label: "Business Continuity", href: `/clients/${clientId}/business-continuity` },
                            { label: "Tasks", href: `/clients/${clientId}/business-continuity/tasks` },
                        ]}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 -ml-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setLocation(`/clients/${clientId}/business-continuity`)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to BC Dashboard
                    </Button>
                </div>
                <BCTaskBoard />
            </div>
        </DashboardLayout>
    );
}
