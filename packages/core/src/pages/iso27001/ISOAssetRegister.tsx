import React from 'react';
import { useParams } from 'wouter';
import { ISOLayout } from './ISOLayout';
import RiskAssetsPage from '../risk/RiskAssetsPage';

export default function ISOAssetRegister() {
    const { id } = useParams<{ id: string }>();
    const clientId = parseInt(id || '0');

    return (
        <ISOLayout clientId={clientId}>
            <RiskAssetsPage hideLayout={true} hideBreadcrumb={true} />
        </ISOLayout>
    );
}
