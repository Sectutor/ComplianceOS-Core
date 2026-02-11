
import React from 'react';
import { VendorOnboardingWizard } from '../../components/onboarding/VendorOnboardingWizard';
import { useLocation, useParams } from 'wouter';

import { PageGuide } from "@/components/PageGuide";

export default function OnboardVendor() {
    const [, setLocation] = useLocation();
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");

    if (!clientId) return <div>Invalid Client ID</div>;

    return (
        <div className="w-full">
            <div className="!p-0 space-y-6">
                <div className="p-6 pb-0">
                    <PageGuide
                        title="Vendor Onboarding"
                        description="Step-by-step qualification for new vendors."
                        rationale="Ensure compliance and security due diligence before data is shared."
                        howToUse={[
                            { step: "Profile", description: "Enter business details and contact info." },
                            { step: "Screening", description: "Check against sanctions and watchlists." },
                            { step: "Assessment", description: "Send security questionnaires (SIG/CAIQ)." }
                        ]}
                    />
                </div>
                <VendorOnboardingWizard
                    clientId={clientId}
                    onComplete={() => setLocation(`/clients/${clientId}/vendors/overview`)}
                    onCancel={() => setLocation(`/clients/${clientId}/vendors/overview`)}
                />
            </div>
        </div>
    );
}
