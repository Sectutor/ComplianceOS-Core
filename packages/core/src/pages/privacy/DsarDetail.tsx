import React from 'react';
import { useClientContext } from "@/contexts/ClientContext";
import { Link, useParams } from "wouter";
import { Button } from "@complianceos/ui/ui/button";
import { ArrowLeft, Users } from "lucide-react";

export default function DsarDetail() {
    const { selectedClientId } = useClientContext();
    const params = useParams<{ dsarId: string }>(); // Route is /clients/:id/privacy/dsar/:dsarId

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4">
                <Link href={`/clients/${selectedClientId}/privacy/dsar`}>
                    <Button variant="ghost" className="w-fit pl-0 text-slate-500 hover:text-[#3ABEF9] hover:bg-transparent font-bold transition-colors">
                        <ArrowLeft className="mr-2 h-5 w-5" /> Back to DSAR Registry
                    </Button>
                </Link>
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">DSAR Case Review</h1>
                    <p className="text-slate-500 text-lg">Detailed view and management of data subject request {params.dsarId}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-12 bg-white shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-sky-50 flex items-center justify-center text-[#3ABEF9]">
                    <Users className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-slate-900">Case # {params.dsarId} Workflow</h2>
                    <p className="text-slate-500 max-w-md">Detailed case management, evidence collection, and automated response generation for this request is currently being initialized.</p>
                </div>
                <Button
                    disabled
                    className="bg-slate-100 text-slate-400 font-bold rounded-xl h-11 px-8"
                >
                    Feature Loading
                </Button>
            </div>
        </div>
    );
}
