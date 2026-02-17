
import React from 'react';
import { useClientContext } from "@/contexts/ClientContext";
import { Button } from "@complianceos/ui/ui/button";
import { Plus } from "lucide-react";
import TIAWorkspace from './TIAWorkspace';

export default function TransferDashboard() {
    const { selectedClientId } = useClientContext();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Data Transfers</h1>
                    <p className="text-slate-500 text-lg">Manage international data transfers and Transfer Impact Assessments (TIA).</p>
                </div>
            </div>

            <TIAWorkspace />
        </div>
    );
}
