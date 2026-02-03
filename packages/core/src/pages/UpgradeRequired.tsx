
import { Shield, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@complianceos/ui/ui/button";
import { useLocation, Link } from "wouter";
import { useClientContext } from "@/contexts/ClientContext";
import DashboardLayout from "@/components/DashboardLayout";

export default function UpgradeRequired() {
    const [location] = useLocation();
    const { selectedClientId } = useClientContext();

    // Parse query params to determine context
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const params = new URLSearchParams(search);
    const featureParam = params.get('feature');

    // Determine feature based on URL or query param
    const getFeatureName = () => {
        if (featureParam === 'custom-frameworks') return "Custom Frameworks";
        if (featureParam === 'risk-reports') return "Risk Management Reporting";
        if (location.includes("vendors") || location.includes("tprm")) return "Vendor Risk Management";
        return "Premium Feature";
    };

    const featureName = getFeatureName();

    // Determine back link and label based on context
    const backLink = featureParam === 'custom-frameworks'
        ? "/frameworks"
        : `/clients/${selectedClientId}/governance`;

    const backLabel = featureParam === 'custom-frameworks'
        ? "Back to Frameworks"
        : "Back to Dashboard";

    return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Lock className="h-8 w-8 text-primary" />
                </div>

                <h1 className="text-3xl font-bold tracking-tight mb-2">
                    {featureName} is a Premium Feature
                </h1>

                <p className="text-muted-foreground max-w-md mb-8 text-lg">
                    Upgrade to a Pro or Enterprise plan to unlock {featureName}, along with advanced reporting, AI automation, and unlimited users.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href={`/clients/${selectedClientId}/settings/billing`}>
                        <Button size="lg" className="w-full sm:w-auto gap-2">
                            <Shield className="h-4 w-4" />
                            Upgrade Plan
                        </Button>
                    </Link>

                    <Link href={backLink}>
                        <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            {backLabel}
                        </Button>
                    </Link>
                </div>

                <div className="mt-12 p-6 bg-muted/30 rounded-lg max-w-2xl border">
                    <h3 className="font-semibold mb-4">What's included in Premium?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-sm">
                        <div className="flex items-start gap-2">
                            <div className="text-green-500 mt-0.5">✓</div>
                            <span>Advanced Vendor Risk Management (TPRM)</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="text-green-500 mt-0.5">✓</div>
                            <span>Custom Framework Imports</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="text-green-500 mt-0.5">✓</div>
                            <span>AI-Powered Compliance Advisor</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="text-green-500 mt-0.5">✓</div>
                            <span>Audit Hub & External Sharing</span>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
