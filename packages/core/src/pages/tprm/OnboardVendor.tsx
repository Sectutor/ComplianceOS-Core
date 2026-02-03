
import React from 'react';
import { VendorOnboardingWizard } from '../../components/onboarding/VendorOnboardingWizard';
import { useLocation, useParams } from 'wouter';

export default function OnboardVendor() {
    const [, setLocation] = useLocation();
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || "0");

    if (!clientId) return <div>Invalid Client ID</div>;

    return (
        <div className="w-full">
            <div className="!p-0">
                <VendorOnboardingWizard
                    clientId={clientId}
                    onComplete={() => setLocation(`/clients/${clientId}/vendors/overview`)}
                    onCancel={() => setLocation(`/clients/${clientId}/vendors/overview`)}
                />
            </div>
        </div>
    );
}
