import React from 'react';
import { useParams } from 'wouter';
import { ISOLayout } from './ISOLayout';
import RiskRegisterPage from '../risk/RiskRegisterPage';

export default function ISORiskManagement() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || '0');

    // We reuse the RiskRegisterPage but the ISOLayout handles the shared navigation
    // Note: RiskRegisterPage currently includes its own DashboardLayout.
    // To avoid nesting, we would ideally use a component version of RiskRegisterPage.
    // For this implementation, we will use the existing page but we'll need to 
    // ensure the breadcrumbs and "Back" buttons make sense.

    return (
        <ISOLayout clientId={clientId}>
            <RiskRegisterPage hideLayout={true} hideBreadcrumb={true} />
        </ISOLayout>
    );
}
